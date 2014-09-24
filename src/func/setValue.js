
var getValue    = require("./getValue.js"),
    toArray     = require("../../../metaphorjs/src/func/array/toArray.js"),
    inArray     = require("../../../metaphorjs/src/func/array/inArray.js"),
    isArray     = require("../../../metaphorjs/src/func/isArray.js"),
    isNumber    = require("../../../metaphorjs/src/func/isNumber.js"),
    undf        = require("../../../metaphorjs/src/var/undf.js"),
    isNull      = require("../../../metaphorjs/src/func/isNull.js"),
    getAttr     = require("../../../metaphorjs/src/func/dom/getAttr.js"),
    setAttr     = require("../../../metaphorjs/src/func/dom/setAttr.js"),
    removeAttr  = require("../../../metaphorjs/src/func/dom/removeAttr.js");

/**
 * @param {Element} el
 * @param {*} val
 */
module.exports = function() {

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

                if (selected) {
                    setAttr(option, "selected", "selected");
                    option.selected = true;
                    optionSet = true;
                }
                else {
                    removeAttr(option, "selected");
                }

                if (!selected && !isNull(getAttr(option, "mjs-default-option"))) {
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
}();