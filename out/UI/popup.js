import "../../plugins/jquery-ui-1.12.1.js";
/**



  

**/
export class Popup {
    constructor(args) {
        /** dictionary of extended properties. This can be used for storing absolutely anything, which will vary depending on popup type */
        this.ext = {};
        // generating buttons given args labels and reverseButtons property
        var ok = getFooterButton(args.ok, "OK");
        var cancel = getFooterButton(args.cancel, "Cancel");
        // TODO: apply left/right margin ONLY if both buttons exist
        let okButton = args.ok ? ("<button type='button' class='ok " + ok.class + (args.cancel ? (args.reverseButtons ? "marg-left-25" : "marg-right-25") : "") + "'>" + ok.label + "</button>") : "";
        let cancelButton = args.cancel ? ("<button type='button' class='cancel " + cancel.class + (args.ok ? (args.reverseButtons ? "marg-right-25" : "marg-left-25") : "") + "'>" + cancel.label + "</button>") : "";
        let buttonHtml = args.reverseButtons ? cancelButton + okButton : okButton + cancelButton;
        // #region applying classes from args
        let modalClasses = "", bodyClasses = "";
        if (args.classes) {
            // classes = string? apply to .popup-modal
            if (typeof args.classes === "string") {
                modalClasses = args.classes;
            }
            // otherwise, apply to specified section
            else if (typeof args.classes === "object") {
                if (typeof args.classes.modal === "string" && args.classes.modal) {
                    modalClasses = args.classes.modal;
                }
                if (typeof args.classes.body === "string" && args.classes.body) {
                    bodyClasses = args.classes.body;
                }
            }
        }
        bodyClasses += args.flex == "column" ? "column " : args.flex == "row" ? "row " : "";
        bodyClasses += args.align == "center" ? "center center-align " : args.align == "end" ? "justify-end " : "";
        let position = args.position || "top";
        let isModal = (typeof args.modal == "boolean" ? args.modal : true);
        modalClasses += (isModal ? "modal " : "");
        modalClasses += position + " ";
        modalClasses += (args.fullscreen == "mobile" ? "mobile " : "");
        modalClasses += (args.size == "large" ? "large " : "");
        modalClasses += (args.overflow ? "overflow " : "");
        modalClasses += (args.pad == "none" ? "pad-none " :
            args.pad == "horizontal" ? "pad-horiz " :
                args.pad == "vertical" ? "pad-vert " :
                    args.pad == "top" ? "pad-top " :
                        args.pad == "small" ? "pad-small " : "");
        modalClasses += (args.error ? "error " : "");
        modalClasses += (args.fullscreen ? "full-screen " : "");
        // #endregion
        /** @type {JQuery<HTMLDivElement>} */
        this.$container = $(/* html */ `<div class='popup-modal ${modalClasses}'>
                <div class='dimmer'></div>
                <div class='popup flex column'>
                    <header class='flex center no-shrink'>
                        <div class='flex fill center title${args.centerTitle ? " justify-center" : ""}'>
                            ${args.icon ? `<i class='material-icons marg-right-25'>${args.icon}</i>` : ""}
                            ${args.title || "Popup Title"}
                        </div>
                        ${args.nomaximize ? "" : "<button type='button' class='btn-icon no-shrink " + (args.fullscreen ? "btn-minimize" : "btn-maximize") + "'></button>"}
                        ${args.noclose ? "" : "<button type='button' class='btn-icon btn-close no-shrink'></button>"}
                    </header>
                    <div class='body flex fill scroll ${bodyClasses}'>${args.body || ""}</div>
                    <footer class='no-shrink${args.separateFooter ? " separated" : ""}'>${buttonHtml}</footer>
                </div>
            </div>`);
        let popup = this;
        if (args.buttons && args.buttons.length) {
            let $title = this.$container.find(".title");
            args.buttons.forEach(btn => {
                $(/*html*/ `<button type='button' class='btn-icon btn-aux no-shrink btn-${btn.type}'${btn.disabled ? " disabled" : ""}></button>`)
                    .on("click", function () {
                    btn.onclick.call(popup, $(this));
                })
                    .insertBefore($title);
            });
        }
        this.$popup = this.$container.children(".popup");
        this.$header = this.$popup.children("header");
        this.$body = this.$popup.children(".body");
        this.$footer = this.$body.next();
        // events
        // note: for all the following events, we check if result is != false to allow closing. This allows falsey values to continue closing (i.e. null). 
        // not every ok is going to return a value, we only want to prevent closing when value is "false" specifically
        const close = () => {
            return new Promise((resolve, _) => {
                if (this.resizeHandler) {
                    window.removeEventListener("resize", this.resizeHandler);
                }
                this.$container.fadeOut(Popup.FadeSpeed.OUT, () => {
                    this.$container.remove();
                    resolve();
                });
            });
        };
        /**
         * async onclose event, returns promise. resolves when popup has successfully faded out
         @param {boolean} silent allows force closing a popup, bypassing close event
         */
        this.onclose = typeof args.onclose === "function" ? (silent) => {
            // 02-08-21 new "silent" parameter: allows force closing a popup, bypassing onclose event. (useful for certain situations such as sales portal contact validation)
            if (silent) {
                console.log("silently closing");
                return close();
            }
            return new Promise((resolve, reject) => {
                invokeAsync(args.onclose.call(popup, popup), (result) => {
                    // prevent closing if onclose returns false (onclose may return promise instead, in which case we check for false promise value)
                    // NOTE: ignoring "falsey" values, it has to specifically be false in order to reject, because oftentimes this result is undefined or null which are falsey
                    if (result == false) {
                        reject("Popup rejected close event.");
                    }
                    else {
                        close().then(() => resolve());
                    }
                });
            });
        } : close;
        this.onok = ok.click ? () => {
            let $buttons = popup.$footer.find("button").prop("disabled", "disabled");
            // prevent closing if onok returns false (onok may return promise instead, in which case we check for false promise value)
            invokeAsync(ok.click.call(popup, popup), (result) => {
                if (result != false) {
                    popup.close();
                }
                else {
                    // 03-29-21: auto-reenabling buttons when onok returns false
                    // onok failed validation -> wait a few milliseconds before re-enabling buttons to prevent accidental double clicks
                    setTimeout(() => $buttons.prop("disabled", false), 400);
                }
            });
        } : function () { popup.close(); };
        this.oncancel = cancel.click ? () => {
            // prevent closing if oncancel returns false (oncancel may pass return promise instead, in which case we check for false promise value)
            invokeAsync(cancel.click.call(popup, popup), (result) => {
                if (result != false) {
                    popup.close();
                }
            });
        } : function () { popup.close(); };
        let $appendTo = $("#menuContentPadder");
        if (!$appendTo.length) {
            $appendTo = $("body");
        }
        popup.$container.appendTo($appendTo);
        popup.show();
        // if forced to fullscreen, don't allow dragging. otherwise, dragging is toggled whenever maximize is toggled
        if (!args.nodrag && !(args.fullscreen == true && args.nomaximize)) {
            let disabled = args.fullscreen == true ? true : (args.fullscreen == "mobile" && window.innerWidth <= 500 ? true : false);
            // @ts-ignore
            popup.$popup.draggable({
                scroll: false,
                containment: popup.$container,
                handle: popup.$header,
                //cursor: "grabbing",
                disabled: disabled // default dragging to disabled when full screen mode
            });
            // if popup bottom escapes container, move to top
            if (popup.$popup.offset().top + popup.$popup.height() >= popup.$container.height()) {
                popup.$popup.css("top", "0");
            }
            if (args.fullscreen == "mobile") {
                this.resizeHandler = function () {
                    // only time dragging is disable for mobile popups is when screen is mobile-sized and popup is fullscreen
                    if (window.innerWidth < 500 && popup.$container.hasClass("full-screen")) {
                        // @ts-ignore
                        popup.$popup.css({ top: 0, left: 0 }).draggable("disable");
                    }
                    else {
                        // @ts-ignore
                        popup.$popup.draggable("enable");
                    }
                };
                window.addEventListener("resize", popup.resizeHandler);
            }
        }
        // calling onok/oncancel from context of $popup
        // i.e. inside of those methods, $(this) will refer to $popup
        // 09-09-20: popup buttons now disable themselves upon click to prevent multiple calls on fast double clicks. this might cause some issues with certain popups that allow user to fix issues and click ok a second time,  in which case they need to manually re-enable ok button on failure
        if (args.ok) {
            this.$container.find("button.ok").on("click", function () {
                // 03-29-20: moving this to inside onok func because its async and not passing back promise chain. also want to auto-reenable button after timeout when result is false
                //$(this).prop("disabled", "disabled");
                popup.onok.call(popup, popup);
            });
        }
        // if no oncancel is provided, make close button simply call close/destroy
        this.$container.find("button.cancel").on("click", function () {
            $(this).prop("disabled", "disabled");
            popup.oncancel.call(popup, popup);
        });
        this.$container.find("header")
            .on("click", ".btn-close", function () {
            $(this).prop("disabled", "disabled");
            if (args.cancelOnClose) {
                popup.oncancel.call(popup, popup);
            }
            else {
                popup.close();
            }
        })
            .on("click", ".btn-maximize", function () {
            // weird scenario: sometimes in chrome mobile emulator, minimize/maximize click is firing immediately after switching minimize/maximize classes (i.e. 1 click = 2 events)
            // and because these are "live" events, you can't stop propagation. easiest solution is to wait 1 milliseocnd
            setTimeout(() => {
                // note: min/maximizing removes position class and replaces it will "full-screen" and vice-versa
                $(this).removeClass("btn-maximize").addClass("btn-minimize");
                popup.$container.removeClass(position).addClass("full-screen");
                if (!args.nodrag) {
                    // @ts-ignore
                    popup.$popup.css({ top: 0, left: 0 }).draggable("option", "disabled", true);
                }
            }, 1);
        })
            .on("click", ".btn-minimize", function () {
            // weird scenario: sometimes in chrome mobile emulator, minimize/maximize click is firing immediately after switching minimize/maximize classes (i.e. 1 click = 2 events)
            // and because these are "live" events, you can't stop propagation. easiest solution is to wait 1 milliseocnd
            setTimeout(() => {
                $(this).removeClass("btn-minimize").addClass("btn-maximize");
                popup.$container.removeClass("full-screen").addClass(position);
                if (!args.nodrag) {
                    // @ts-ignore
                    popup.$popup.draggable("option", "disabled", false);
                }
            }, 1);
        });
        if (isModal) {
            popup.$container.find(".dimmer").on("click", function () {
                // result might be promise that we have to wait for
                invokeAsync(args.cancelOnClose ? popup.oncancel.call(popup, popup) : popup.onclose(), (value) => {
                    // need to turn off click event to prevent calling multiplle times on fast double click
                    if (value) {
                        $(this).off("click");
                    }
                });
            });
        }
        if (typeof args.init === "function") {
            args.init.call(popup, popup);
        }
    }
    /** @param {boolean} [silent] */
    close(silent = false) {
        return this.onclose(silent);
    }
    show() {
        this.$container.hide().fadeIn(Popup.FadeSpeed.IN);
    }
    hide() {
        this.$container.fadeOut(Popup.FadeSpeed.OUT);
    }
    maximize() {
        this.$container.find("header").find(".btn-maximize").click();
    }
    minimize() {
        this.$container.find("header").find(".btn-minimize").click();
    }
    // #region notifications
    // notify is the base notification function used by error and success
    // message: the html to be injected inside notification body. if null/"", notification will not be created
    // timeout: time (in ms) before notification is auto-closed. timeout=0 requires manual click to close. DEFAULT = 2 seconds
    // position: TODO: top-center, top-left, etc
    // color: possible colors are "success", "error", "accent", "text", "menu" (theme colors)
    // UNFINISHED: have notifications stack on top of eachother
    // UNFINISHED: allow growing to max-width (max-width is screen width on small screens?)
    static notify(message, color, timeout) {
        if (message == null || message == "") {
            console.log("Popup.notify: notification not created because message was empty.");
            return;
        }
        let $container = $(".popup-notifications");
        if (!$container.length) {
            $container = $("<div class='popup-notifications'></div>").appendTo($("body"));
        }
        let $this = $("<div class='" + (color !== null && color !== void 0 ? color : "accent") + "'>" + message + "</div>").appendTo($container).hide().fadeIn(Popup.FadeSpeed.IN);
        function close() {
            $this.fadeOut(Popup.FadeSpeed.OUT, function () {
                $this.remove();
            });
        }
        $this.on("click", close);
        // if timeout, auto-close after time reached, otherwise require manual click to close
        // (timeout defaults to 2000, but can be set to <0 to disable)
        if ((isNaN(timeout) ? 2000 : timeout) > 0) {
            setTimeout(close, timeout);
        }
    }
    static closeAllNotifications() {
        $(".popup-notifications").children().fadeOut(Popup.FadeSpeed.OUT, function () { $(this).remove(); });
    }
    static success(message, timeout) {
        return this.notify(message, "success", timeout);
    }
    static error(message, timeout) {
        return this.notify(message, "error", timeout);
    }
}
// apparently classes can only have static methods and not properties...
Popup.FadeSpeed = {
    IN: 250,
    OUT: 125
};
// #endregion notifications
/** @param {PopupOptions & PromptOptions} options */
Popup.prompt = (options) => new PromptPopup(options);
class PromptPopup extends Popup {
    constructor(args) {
        // #region overriding some options
        args.classes = "popup-prompt";
        args.flex = "column";
        args.body = "<div class='prompt-message'>" + (typeof args.message === "string" ? args.message : "") + "</div>\
            <div class='input-wrapper marg-top-25'>\
                <label>" + (typeof args.label === "string" ? args.label : "") + "</label>\
            <input " +
            (args.type === "number" ? "type='number' pattern='[0-9]*' " : "") +
            (typeof args.value !== "undefined" && args.value !== null ? "value='" + args.value + "'" : "") + " " +
            (typeof args.placeholder !== "undefined" && args.placeholder !== null ? "placeholder='" + args.placeholder + "'" : "") +
            " />\
            </div>";
        const ok = getFooterButton(args.ok, "OK");
        const cancel = getFooterButton(args.cancel, "Cancel");
        // NOTE: only doing ok/cancel if not buttonless. otherwise the logic needs to be done in onchange for anything to happen
        // TODO: do we want to return popup or promise?
        if (ok.click) {
            args.ok = {
                label: ok.label,
                class: ok.class,
                /** @this PromptPopup */
                click: function () {
                    return ok.click.call(this, this, this.$body.find("input").val());
                }
            };
        }
        if (cancel.click) {
            args.cancel = {
                label: cancel.label,
                class: cancel.class,
                /** @this PromptPopup */
                click: function () {
                    return cancel.click.call(this, this, this.$body.find("input").val());
                }
            };
        }
        // #endregion
        super(args);
        this.$message = this.$body.find(".prompt-message");
        this.$input = this.$body.find("input").focus().select();
        if (args.onchange) {
            this.$input.on("change", () => args.onchange.call(this, this, this.$input.val()));
        }
        this.$input.on("keydown", e => {
            let key = e.which || e.keyCode;
            if (key == 13) {
                if (ok.click) {
                    ok.click.call(this, this);
                }
                else {
                    this.$input.trigger("change");
                }
            }
        });
    }
    /** update message with provided string. if error is truthy, the text will be error color */
    updateMessage(message, isError) {
        this.$message.html(message).toggleClass("error", isError);
    }
    /** update label with provided string. if error is truthy, the input will be error color */
    updateInput(label, isError) {
        this.$input.prev().html(label).parent().toggleClass("error", isError);
    }
}
/** Takes an expression to to execute on a value. if value is a promise, it waits for the promise to return a value, otherwise it executes with the value immediately */
function invokeAsync(object, func) {
    if (object instanceof Promise) {
        object.then(result => func(result));
    }
    else {
        func(object);
    }
}
/** for ease of programming, footer buttons can be passed in 3 different ways, an object, a function, or a boolean. Need to convert these into a consistent type to make things more straight forward down the line */
function getFooterButton(footerButton, defaultLabel) {
    var _a, _b;
    // null || bool || function gets no custom class, default label, and only has click function if passed as a function
    if (!footerButton || typeof footerButton === "boolean" || typeof footerButton === "function") {
        return {
            class: "",
            label: defaultLabel,
            click: typeof footerButton == "function" ? footerButton : null
        };
    }
    return {
        class: (_a = (footerButton.class + " ")) !== null && _a !== void 0 ? _a : "",
        label: (_b = footerButton.label) !== null && _b !== void 0 ? _b : defaultLabel,
        click: footerButton.click
    };
}
;
//# sourceMappingURL=popup.js.map