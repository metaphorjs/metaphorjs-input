
/**
 * @param {Function} fn
 * @param {*} context
 */
var bind = Function.prototype.bind ?
              function(fn, context){
                  return fn.bind(context);
              } :
              function(fn, context) {
                  return function() {
                      return fn.apply(context, arguments);
                  };
              };


var addListener = function(el, event, func) {
    if (el.attachEvent) {
        el.attachEvent('on' + event, func);
    } else {
        el.addEventListener(event, func, false);
    }
};

var removeListener = function(el, event, func) {
    if (el.detachEvent) {
        el.detachEvent('on' + event, func);
    } else {
        el.removeEventListener(event, func, false);
    }
};
var isNull = function(value) {
    return value === null;
};
var toString = Object.prototype.toString;
var undf = undefined;



var varType = function(){

    var types = {
        '[object String]': 0,
        '[object Number]': 1,
        '[object Boolean]': 2,
        '[object Object]': 3,
        '[object Function]': 4,
        '[object Array]': 5,
        '[object RegExp]': 9,
        '[object Date]': 10
    };


    /**
        'string': 0,
        'number': 1,
        'boolean': 2,
        'object': 3,
        'function': 4,
        'array': 5,
        'null': 6,
        'undefined': 7,
        'NaN': 8,
        'regexp': 9,
        'date': 10
    */

    return function(val) {

        if (!val) {
            if (val === null) {
                return 6;
            }
            if (val === undf) {
                return 7;
            }
        }

        var num = types[toString.call(val)];

        if (num === undf) {
            return -1;
        }

        if (num == 1 && isNaN(val)) {
            return 8;
        }

        return num;
    };

}();


var isString = function(value) {
    return typeof value == "string" || varType(value) === 0;
};


/**
 * @param {String} value
 */
var trim = function() {
    // native trim is way faster: http://jsperf.com/angular-trim-test
    // but IE doesn't have it... :-(
    if (!String.prototype.trim) {
        return function(value) {
            return isString(value) ? value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') : value;
        };
    }
    return function(value) {
        return isString(value) ? value.trim() : value;
    };
}();


/**
 * @param {Element} elem
 */
var getValue = function(){


    var rreturn = /\r/,

        hooks = {

        option: function(elem) {
            var val = elem.getAttribute("value") || elem.value;

            return val != undf ?
                   val :
                   trim( elem.innerText || elem.textContent );
        },

        select: function(elem) {

            var value, option,
                options = elem.options,
                index = elem.selectedIndex,
                one = elem.type === "select-one" || index < 0,
                values = one ? null : [],
                max = one ? index + 1 : options.length,
                disabled,
                i = index < 0 ?
                    max :
                    one ? index : 0;

            // Loop through all the selected options
            for ( ; i < max; i++ ) {
                option = options[ i ];

                disabled = option.disabled ||
                           option.parentNode.disabled;

                // IE6-9 doesn't update selected after form reset (#2551)
                if ((option.selected || i === index) && !disabled ) {
                    // Get the specific value for the option
                    value = getValue(option);

                    // We don't need an array for one selects
                    if ( one ) {
                        return value;
                    }

                    // Multi-Selects return an array
                    values.push( value );
                }
            }

            return values;
        },

        radio: function( elem ) {
            return isNull(elem.getAttribute("value")) ? "on" : elem.value;
        },

        checkbox: function( elem ) {
            return isNull(elem.getAttribute("value")) ? "on" : elem.value;
        }
    };

    return function(elem) {

        var hook, ret;

        hook = hooks[elem.type] || hooks[elem.nodeName.toLowerCase()];

        if (hook && (ret = hook(elem, "value")) !== undf) {
            return ret;
        }

        ret = elem.value;

        return isString(ret) ?
            // Handle most common string cases
               ret.replace(rreturn, "") :
            // Handle cases where value is null/undef or number
               ret == null ? "" : ret;

    };
}();


/**
 * @param {*} list
 * @returns {[]}
 */
var toArray = function(list) {
    if (list && !list.length != undf && !isString(list)) {
        for(var a = [], i =- 1, l = list.length>>>0; ++i !== l; a[i] = list[i]){}
        return a;
    }
    else if (list) {
        return [list];
    }
    else {
        return [];
    }
};
var aIndexOf    = Array.prototype.indexOf;

if (!aIndexOf) {
    aIndexOf = Array.prototype.indexOf = function (searchElement, fromIndex) {

        var k;

        // 1. Let O be the result of calling ToObject passing
        //    the this value as the argument.
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }

        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get
        //    internal method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If len is 0, return -1.
        if (len === 0) {
            return -1;
        }

        // 5. If argument fromIndex was passed let n be
        //    ToInteger(fromIndex); else let n be 0.
        var n = +fromIndex || 0;

        if (Math.abs(n) === Infinity) {
            n = 0;
        }

        // 6. If n >= len, return -1.
        if (n >= len) {
            return -1;
        }

        // 7. If n >= 0, then Let k be n.
        // 8. Else, n<0, Let k be len - abs(n).
        //    If k is less than 0, then let k be 0.
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

        // 9. Repeat, while k < len
        while (k < len) {
            var kValue;
            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the
            //    HasProperty internal method of O with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            //    i.  Let elementK be the result of calling the Get
            //        internal method of O with the argument ToString(k).
            //   ii.  Let same be the result of applying the
            //        Strict Equality Comparison Algorithm to
            //        searchElement and elementK.
            //  iii.  If same is true, return k.
            if (k in O && O[k] === searchElement) {
                return k;
            }
            k++;
        }
        return -1;
    };
}




/**
 * @param {*} val
 * @param {[]} arr
 * @returns {boolean}
 */
var inArray = function(val, arr) {
    return arr ? (aIndexOf.call(arr, val) != -1) : false;
};


/**
 * @param {*} value
 * @returns {boolean}
 */
var isArray = function(value) {
    return typeof value == "object" && varType(value) === 5;
};


var isNumber = function(value) {
    return varType(value) === 1;
};


/**
 * @param {Element} el
 * @param {*} val
 */
var setValue = function() {

    var hooks = {
        select:  function(elem, value) {

            var optionSet, option,
                options     = elem.options,
                values      = toArray(value),
                i           = options.length,
                selected,
                setIndex    = -1;

            while ( i-- ) {
                option      = options[i];
                selected    = inArray(option.value, values);

                //if ((option.selected = inArray(option.value, values))) {
                if (selected) {
                    option.setAttribute("selected", "selected");
                    optionSet = true;
                }
                else {
                    option.removeAttribute("selected");
                }

                if (!selected && !isNull(option.getAttribute("mjs-default-option"))) {
                    setIndex = i;
                }
            }

            // Force browsers to behave consistently when non-matching value is set
            if (!optionSet) {
                elem.selectedIndex = setIndex;
            }
            return values;
        }
    };

    hooks["radio"] = hooks["checkbox"] = function(elem, value) {
        if (isArray(value) ) {
            return (elem.checked = inArray(getValue(elem), value));
        }
    };


    return function(el, val) {

        if (el.nodeType !== 1) {
            return;
        }

        // Treat null/undefined as ""; convert numbers to string
        if (isNull(val)) {
            val = "";
        }
        else if (isNumber(val)) {
            val += "";
        }

        var hook = hooks[el.type] || hooks[el.nodeName.toLowerCase()];

        // If set returns undefined, fall back to normal setting
        if (!hook || hook(el, val, "value") === undf) {
            el.value = val;
        }
    };
}();/**
 * @param {Element} elem
 * @returns {boolean}
 */
var isSubmittable = function(elem) {
    var type	= elem.type ? elem.type.toLowerCase() : '';
    return elem.nodeName.toLowerCase() == 'input' && type != 'radio' && type != 'checkbox';
};
var uaString = navigator.userAgent.toLowerCase();


var isAndroid = function(){

    var android = parseInt((/android (\d+)/.exec(uaString) || [])[1], 10) || false;

    return function() {
        return android;
    };

}();


var isIE = function(){

    var msie    = parseInt((/msie (\d+)/.exec(uaString) || [])[1], 10);

    if (isNaN(msie)) {
        msie    = parseInt((/trident\/.*; rv:(\d+)/.exec(uaString) || [])[1], 10) || false;
    }

    return function() {
        return msie;
    };
}();//#require isIE.js



/**
 * @param {String} event
 * @return {boolean}
 */
var browserHasEvent = function(){

    var eventSupport = {};

    return function(event) {
        // IE9 implements 'input' event it's so fubared that we rather pretend that it doesn't have
        // it. In particular the event is not fired when backspace or delete key are pressed or
        // when cut operation is performed.

        if (eventSupport[event] === undf) {

            if (event == 'input' && isIE() == 9) {
                return eventSupport[event] = false;
            }

            var divElm = document.createElement('div');
            eventSupport[event] = !!('on' + event in divElm);
        }

        return eventSupport[event];
    };
}();



var Input = function(el, changeFn, changeFnContext, submitFn) {

    var self    = this,
        type;

    self.el             = el;
    self.cb             = changeFn;
    self.scb            = submitFn;
    self.cbContext      = changeFnContext;
    self.inputType      = type = (el.getAttribute("mjs-input-type") || el.type.toLowerCase());
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

Input.prototype = {

    el: null,
    inputType: null,
    cb: null,
    scb: null,
    cbContext: null,
    listeners: [],
    radio: null,
    submittable: false,

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

        delete self.radio;
        delete self.el;
        delete self.cb;
        delete self.cbContext;
    },

    initRadioInput: function() {

        var self    = this,
            el      = self.el,
            type    = el.type,
            name    = el.name,
            radio,
            i, len;

        self.onRadioInputChangeDelegate = bind(self.onRadioInputChange, self);

        if (document.querySelectorAll) {
            radio = document.querySelectorAll("input[name="+name+"]");
        }
        else {
            var nodes = document.getElementsByTagName("input"),
                node;

            radio = [];
            for (i = 0, len = nodes.length; i < len; i++) {
                node = nodes[i];
                if (node.type == type && node.name == name) {
                    radio.push(node);
                }
            }
        }

        self.radio  = radio;
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

        // if the browser does support "input" event, we are fine - except on
        // IE9 which doesn't fire the
        // input event on backspace, delete or cut
        if (browserHasEvent('input')) {
            listeners.push(["input", listener]);
            addListener(node, "input", listener);

        } else {

            var deferListener = function(ev) {
                if (!timeout) {
                    timeout = window.setTimeout(function() {
                        listener(ev);
                        timeout = null;
                    }, 0);
                }
            };

            var keydown = function(event) {
                event = event || window.event;
                var key = event.keyCode;

                if (key == 13 && self.submittable && self.scb) {
                    return self.scb.call(self.cbContext, event);
                }

                // ignore
                //    command            modifiers                   arrows
                if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) {
                    return;
                }

                deferListener(event);
            };

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
            self.cb.call(self.cbContext, node.checked ? (node.getAttribute("value") || true) : false);
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
            return self.el.checked ? (self.el.getAttribute("value") || true) : false;
        }
        else {
            return self.processValue(getValue(self.el));
        }
    }
};

Input.getValue = getValue;
Input.setValue = setValue;


module.exports = Input;