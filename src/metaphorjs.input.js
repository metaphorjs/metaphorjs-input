
var getValue = require("func/getValue.js"),
    setValue = require("func/setValue.js"),

    bind    = require("metaphorjs/src/func/bind.js"),
    extend = require("metaphorjs/src/func/extend.js"),
    addListener = require("metaphorjs/src/func/event/addListener.js"),
    removeListener = require("metaphorjs/src/func/event/removeListener.js"),
    isAttached = require("metaphorjs/src/func/dom/isAttached.js"),
    isAndroid = require("metaphorjs/src/func/browser/isAndroid.js"),
    browserHasEvent = require("metaphorjs/src/func/browser/browserHasEvent.js"),
    getAttr = require("metaphorjs/src/func/dom/getAttr.js"),
    select = require("metaphorjs-select/src/metaphorjs.select.js"),
    getNodeConfig = require("metaphorjs/src/func/dom/getNodeConfig.js"),
    normalizeEvent = require("metaphorjs/src/func/event/normalizeEvent.js"),
    Observable = require("metaphorjs-observable/src/metaphorjs.observable.js");


var Input = function(el, changeFn, changeFnContext) {

    if (el.$$input) {
        if (changeFn) {
            el.$$input.on("change", changeFn, changeFnContext);
        }
        return el.$$input;
    }

    var self    = this,
        cfg     = getNodeConfig(el);

    self.observable     = new Observable;
    self.el             = el;
    self.inputType      = cfg.type || el.type.toLowerCase();
    self.listeners      = [];

    if (changeFn) {
        self.onChange(changeFn, changeFnContext);
    }
};

extend(Input.prototype, {

    el: null,
    inputType: null,
    listeners: null,
    radio: null,
    keydownDelegate: null,
    changeInitialized: false,

    destroy: function() {

        var self        = this,
            i;

        self.observable.destroy();
        self._addOrRemoveListeners(removeListener, true);

        self.el.$$input = null;

        for (i in self) {
            if (self.hasOwnProperty(i)) {
                self[i] = null;
            }
        }
    },

    _addOrRemoveListeners: function(fn, onlyUsed) {

        var self        = this,
            type        = self.inputType,
            listeners   = self.listeners,
            radio       = self.radio,
            el          = self.el,
            used,
            i, ilen,
            j, jlen;

        for (i = 0, ilen = listeners.length; i < ilen; i++) {

            used = !!listeners[i][2];

            if (used == onlyUsed) {
                if (type == "radio") {
                    for (j = 0, jlen = radio.length; j < jlen; j++) {
                        fn(radio[j], listeners[i][0], listeners[i][1]);
                    }
                }
                else {
                    fn(el, listeners[i][0], listeners[i][1]);
                }
                listeners[i][2] = !onlyUsed;
            }
        }
    },

    initInputChange: function() {

        var self = this,
            type = self.inputType;

        if (type == "radio") {
            self.initRadioInput();
        }
        else if (type == "checkbox") {
            self.initCheckboxInput();
        }
        else {
            self.initTextInput();
        }

        self._addOrRemoveListeners(addListener, false);

        self.changeInitialized = true;
    },

    initRadioInput: function() {

        var self    = this,
            el      = self.el,
            name    = el.name,
            parent;

        if (isAttached(el)) {
            parent  = el.ownerDocument;
        }
        else {
            parent = el;
            while (parent.parentNode) {
                parent = parent.parentNode;
            }
        }

        self.radio  = select("input[name="+name+"]", parent);

        self.onRadioInputChangeDelegate = bind(self.onRadioInputChange, self);
        self.listeners.push(["click", self.onRadioInputChangeDelegate, false]);
    },

    initCheckboxInput: function() {

        var self    = this;

        self.onCheckboxInputChangeDelegate = bind(self.onCheckboxInputChange, self);
        self.listeners.push(["click", self.onCheckboxInputChangeDelegate, false]);
    },

    initTextInput: function() {

        var composing   = false,
            self        = this,
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

            listeners.push(["compositionstart", compositionStart, false]);
            listeners.push(["compositionend", compositionEnd, false]);
        }

        var listener = self.onTextInputChangeDelegate = function() {
            if (composing) {
                return;
            }
            self.onTextInputChange();
        };

        var deferListener = function(ev) {
            if (!timeout) {
                timeout = setTimeout(function() {
                    listener(ev);
                    timeout = null;
                }, 0);
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

            listeners.push(["input", listener, false]);

        } else {

            listeners.push(["keydown", keydown, false]);

            // if user modifies input value using context menu in IE,
            // we need "paste" and "cut" events to catch it
            if (browserHasEvent('paste')) {
                listeners.push(["paste", deferListener, false]);
                listeners.push(["cut", deferListener, false]);
            }
        }


        // if user paste into input using mouse on older browser
        // or form autocomplete on newer browser, we need "change" event to catch it

        listeners.push(["change", listener, false]);
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

        self.observable.trigger("change", val);
    },

    onCheckboxInputChange: function() {

        var self    = this,
            node    = self.el;

        self.observable.trigger("change", node.checked ? (getAttr(node, "value") || true) : false);
    },

    onRadioInputChange: function(e) {

        e = e || window.event;

        var self    = this,
            trg     = e.target || e.srcElement;

        self.observable.trigger("change", trg.value);
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


    onChange: function(fn, context) {
        var self = this;
        if (!self.changeInitialized) {
            self.initInputChange();
        }
        this.observable.on("change", fn, context);
    },

    unChange: function(fn, context) {
        this.observable.un("change", fn, context);
    },


    onKey: function(key, fn, context) {

        var self = this;

        if (!self.keydownDelegate) {
            self.keydownDelegate = bind(self.keyHandler, self);
            self.listeners.push(["keydown", self.keydownDelegate, false]);
            addListener(self.el, "keydown", self.keydownDelegate);
            self.observable.createEvent("key", false, false, self.keyEventFilter);
        }

        self.observable.on("key", fn, context, {
            key: key
        });
    },

    unKey: function(key, fn, context) {

        var self    = this;
        self.observable.un("key", fn, context);
    },

    keyEventFilter: function(l, args) {

        var key = l.key,
            e = args[0];

        if (typeof key != "object") {
            return key == e.keyCode;
        }
        else {
            if (key.ctrlKey !== undf && key.ctrlKey != e.ctrlKey) {
                return false;
            }
            if (key.shiftKey !== undf && key.shiftKey != e.shiftKey) {
                return false;
            }
            return !(key.keyCode !== undf && key.keyCode != e.keyCode);
        }
    },

    keyHandler: function(event) {

        var e       = normalizeEvent(event || window.event),
            self    = this;

        self.observable.trigger("key", e);
    }


}, true, false);


Input.get = function(node) {
    if (node.$$input) {
        return node.$$input;
    }
    return new Input(node);
};

Input.getValue = getValue;
Input.setValue = setValue;


module.exports = Input;