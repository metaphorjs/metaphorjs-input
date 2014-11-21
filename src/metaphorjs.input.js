
var bind    = require("../../metaphorjs/src/func/bind.js"),
    extend = require("../../metaphorjs/src/func/extend.js"),
    addListener = require("../../metaphorjs/src/func/event/addListener.js"),
    removeListener = require("../../metaphorjs/src/func/event/removeListener.js"),
    getValue = require("func/getValue.js"),
    setValue = require("func/setValue.js"),
    isSubmittable = require("../../metaphorjs/src/func/dom/isSubmittable.js"),
    isAndroid = require("../../metaphorjs/src/func/browser/isAndroid.js"),
    browserHasEvent = require("../../metaphorjs/src/func/browser/browserHasEvent.js"),
    getAttr = require("../../metaphorjs/src/func/dom/getAttr.js"),
    select = require("../../metaphorjs-select/src/metaphorjs.select.js"),
    getNodeConfig = require("../../metaphorjs/src/func/dom/getNodeConfig.js"),
    normalizeEvent = require("../../metaphorjs/src/func/event/normalizeEvent.js");


var Input = function(el, changeFn, changeFnContext, submitFn) {

    var self    = this,
        cfg     = getNodeConfig(el),
        type;

    self.el             = el;
    self.cb             = changeFn;
    self.scb            = submitFn;
    self.cbContext      = changeFnContext;
    self.inputType      = type = (cfg.type || el.type.toLowerCase());
    self.listeners      = [];
    self.submittable    = isSubmittable(el);

    if (type == "radio") {
        self.initRadioInput();
    }
    else if (type == "checkbox") {
        self.initCheckboxInput();
    }
    else {
        self.initTextInput();
    }
};

extend(Input.prototype, {

    el: null,
    inputType: null,
    cb: null,
    scb: null,
    cbContext: null,
    listeners: null,
    radio: null,
    submittable: false,
    keyListeners: null,
    keydownDelegate: null,

    destroy: function() {

        var self        = this,
            type        = self.inputType,
            listeners   = self.listeners,
            radio       = self.radio,
            el          = self.el,
            i, ilen,
            j, jlen;

        for (i = 0, ilen = listeners.length; i < ilen; i++) {
            if (type == "radio") {
                for (j = 0, jlen = radio.length; j < jlen; j++) {
                    removeListener(radio[j], listeners[i][0], listeners[i][1]);
                }
            }
            else {
                removeListener(el, listeners[i][0], listeners[i][1]);
            }
        }

        for (i in self) {
            if (self.hasOwnProperty(i)) {
                self[i] = null;
            }
        }
    },

    initRadioInput: function() {

        var self    = this,
            el      = self.el,
            name    = el.name,
            radio,
            i, len;


        self.radio  = radio = select("input[name="+name+"]", el.ownerDocument);

        self.onRadioInputChangeDelegate = bind(self.onRadioInputChange, self);
        self.listeners.push(["click", self.onRadioInputChangeDelegate]);

        for (i = 0, len = radio.length; i < len; i++) {
            addListener(radio[i], "click", self.onRadioInputChangeDelegate);
        }
    },

    initCheckboxInput: function() {

        var self    = this;

        self.onCheckboxInputChangeDelegate = bind(self.onCheckboxInputChange, self);

        self.listeners.push(["click", self.onCheckboxInputChangeDelegate]);
        addListener(self.el, "click", self.onCheckboxInputChangeDelegate);
    },

    initTextInput: function() {

        var composing   = false,
            self        = this,
            node        = self.el,
            listeners   = self.listeners,
            timeout;

        // In composition mode, users are still inputing intermediate text buffer,
        // hold the listener until composition is done.
        // More about composition events:
        // https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent
        if (!isAndroid()) {

            var compositionStart    = function() {
                composing = true;
            };

            var compositionEnd  = function() {
                composing = false;
                listener();
            };

            listeners.push(["compositionstart", compositionStart]);
            listeners.push(["compositionend", compositionEnd]);

            addListener(node, "compositionstart", compositionStart);
            addListener(node, "compositionend", compositionEnd);
        }

        var listener = self.onTextInputChangeDelegate = function() {
            if (composing) {
                return;
            }
            self.onTextInputChange();
        };

        var deferListener = function(ev) {
            if (!timeout) {
                timeout = window.setTimeout(function() {
                    listener(ev);
                    timeout = null;
                }, 0);
            }
        };

        var keydownSubmit = function(event) {
            event = event || window.event;
            var key = event.keyCode;

            if (key == 13) {
                return self.scb.call(self.cbContext, event);
            }
        };

        var keydown = function(event) {
            event = event || window.event;
            var key = event.keyCode;

            // ignore
            //    command            modifiers                   arrows
            if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) {
                return;
            }

            deferListener(event);
        };

        // if the browser does support "input" event, we are fine - except on
        // IE9 which doesn't fire the
        // input event on backspace, delete or cut
        if (browserHasEvent('input')) {

            listeners.push(["input", listener]);
            addListener(node, "input", listener);

        } else {

            listeners.push(["keydown", keydown]);
            addListener(node, "keydown", keydown);

            // if user modifies input value using context menu in IE,
            // we need "paste" and "cut" events to catch it
            if (browserHasEvent('paste')) {

                listeners.push(["paste", deferListener]);
                listeners.push(["cut", deferListener]);

                addListener(node, "paste", deferListener);
                addListener(node, "cut", deferListener);
            }
        }

        if (self.scb && self.submittable) {
            listeners.push(["keydown", keydownSubmit]);
            addListener(node, "keydown", keydownSubmit);
        }

        // if user paste into input using mouse on older browser
        // or form autocomplete on newer browser, we need "change" event to catch it

        listeners.push(["change", listener]);
        addListener(node, "change", listener);
    },

    processValue: function(val) {

        switch (this.inputType) {
            case "number":
                val     = parseInt(val, 10);
                if (isNaN(val)) {
                    val = 0;
                }
                break;
        }

        return val;
    },

    onTextInputChange: function() {

        var self    = this,
            val     = self.getValue();

        if (self.cb) {
            self.cb.call(self.cbContext, val);
        }
    },

    onCheckboxInputChange: function() {

        var self    = this,
            node    = self.el;

        if (self.cb) {
            self.cb.call(self.cbContext, node.checked ? (getAttr(node, "value") || true) : false);
        }
    },

    onRadioInputChange: function(e) {

        e = e || window.event;

        var self    = this,
            trg     = e.target || e.srcElement;

        if (self.cb) {
            self.cb.call(self.cbContext, trg.value);
        }
    },

    setValue: function(val) {

        var self    = this,
            type    = self.inputType,
            radio,
            i, len;

        if (type == "radio") {

            radio = self.radio;

            for (i = 0, len = radio.length; i < len; i++) {
                radio[i].checked = radio[i].value == val;
            }
        }
        else if (type == "checkbox") {
            var node        = self.el;
            node.checked    = val === true || val == node.value;
        }
        else {
            setValue(self.el, val);
        }
    },

    getValue: function() {

        var self    = this,
            type    = self.inputType,
            radio,
            i, l;

        if (type == "radio") {
            radio = self.radio;
            for (i = 0, l = radio.length; i < l; i++) {
                if (radio[i].checked) {
                    return radio[i].value;
                }
            }
            return null;
        }
        else if (type == "checkbox") {
            return self.el.checked ? (getAttr(self.el, "value") || true) : false;
        }
        else {
            return self.processValue(getValue(self.el));
        }
    },

    onKey: function(key, fn, context) {

        var self = this;

        if (!self.keyListeners) {
            self.keyListeners = [];
            self.keydownDelegate = bind(self.keyHandler, self);
            self.listeners.push(["keydown", self.keydownDelegate]);
            addListener(self.el, "keydown", self.keydownDelegate);
        }

        self.keyListeners.push({
            key: key,
            fn: fn,
            context: context
        });
    },

    keyHandler: function(event) {

        var e       = normalizeEvent(event || window.event),
            self    = this,
            kl      = self.keyListeners,
            i, l,
            key;

        for (i = 0, l = kl.length; i < l; i++) {
            key = kl[i].key;
            if (typeof key != "object") {
                if (key == e.keyCode) {
                    kl[i].fn.call(kl[i].context, e);
                }
            }
            else {
                if (key.ctrlKey !== undf && key.ctrlKey != e.ctrlKey) {
                    continue;
                }
                if (key.shiftKey !== undf && key.shiftKey != e.shiftKey) {
                    continue;
                }
                if (key.keyCode !== undf && key.keyCode != e.keyCode) {
                    continue;
                }
                kl[i].fn.call(kl[i].context, e);
            }
        }
    },

    unKey: function(key, fn, context) {

        var self    = this,
            kl      = self.keyListeners,
            i, l;

        for (i = 0, l = kl.length; i < l; i++) {
            if (kl[i].key == key && kl[i].fn === fn && kl[i].context === context) {
                kl.splice(i, 1);
            }
        }
    }


}, true, false);

Input.getValue = getValue;
Input.setValue = setValue;


module.exports = Input;