/*jslint browser: true,  todo: true, vars: true, nomen: true */
/**
 * An object which has smarter treatment of property paths.
 * @module Props
 * @author Erik Pearson <eapearson@lbl.gov>
 * @version 0.0.2
 * 
 * @todo complete testing
 * @todo determine if methods are unused, and if so, remove them
 * @todo move the xProp methods to their own module
 * @todo add exception and async testing
 * @todo move any kbase api methods into kb.utils.api
 */



/**
 * An ordered list of properties that specify a path into an object. Each
 * path item represents a property name of the current object. The first 
 * item represents a property of the immediate object, the second a property
 * of the value of the first property, if that contained an object, and so
 * forth. The canonical representation is an array of strings, but a string
 * with property components separated by dots is a natural and easier form
 * for people.
 * 
 * @typedef {(string|string[])} PropertyPath
 */

define([], function () {
    "use strict";
    var Props = Object.create({}, {
        init: {
            value: function (cfg) {
                this.state = {};
                return this;
            }
        },
        version: {
            value: '0.0.1',
            writable: false
        },
        /**
         * Get the value for property from an object. The property may
         * be provided as string or array of strings. If a string, it 
         * will be converted to an array by splitting at each period (.). 
         * The array of strings forms a "path" into the object. 
         * 
         * @function  getProp
         * 
         * @param {object} obj - The object containing the property
         * @param {string|string[]} props - The path into the object on 
         * which to find the value.
         * @param {Any} defaultValue - A value to return if the property was not 
         * found. Defaults to undefined.
         * 
         * @returns {Any} - The property value, if found, or the 
         * default value, if not.
         * 
         * @example
         * var room = {livingroom: {chair: {color: 'red'}}}
         * var color = U.getProp(room, 'livingroom.chair.color');
         * // color === 'red';
         * 
         * @static
         */
        getProp: {
            value: function (props, defaultValue) {
                if (typeof props === 'string') {
                    props = props.split('.');
                } else if (!(props instanceof Array)) {
                    throw new TypeError('Invalid type for key: ' + (typeof props));
                }
                var i;
                var obj = this.state;
                for (i = 0; i < props.length; i += 1) {
                    console.log(obj);
                    if ((obj === undefined) ||
                            (typeof obj !== 'object') ||
                            (obj === null)) {
                        return defaultValue;
                    }
                    obj = obj[props[i]];
                }
                if (obj === undefined) {
                    return defaultValue;
                } else {
                    return obj;
                }
            }
        },
        /**
         * Determine whether a nested property exists on the given 
         * object.
         * 
         * @function hasProp
         * 
         * @param {object} obj - The object in question
         * @param {PropertyPath} propPath - The property to be 
         * inspected.
         * 
         * @returns {boolean} - true if the property exists, false 
         * otherwise.
         * 
         * @example
         * var obj = {earth: {northamerica: {unitedstates: {california: {berkeley: {university: 'ucb'}}}}}};
         * var hasUniversity = U.hasProp(obj, 'earth.northamerica.unitedstates.california.berkeley.university');
         * // hasUniversity === true
         * 
         * @static
         */
        hasProp: {
            value: function (propPath) {
                if (typeof propPath === 'string') {
                    propPath = propPath.split('.');
                }
                var i;
                var obj = this.state;
                for (i = 0; i < propPath.length; i += 1) {
                    if ((obj === undefined) ||
                            (typeof obj !== 'object') ||
                            (obj === null)) {
                        return false;
                    }
                    obj = obj[propPath[i]];
                }
                if (obj === undefined) {
                    return false;
                } else {
                    return true;
                }
            }
        },
        /**
         * Set the nested property of the object to the given value.
         * Since this is a nested property, the final property key
         * is the one that actually gets the value, any prior property
         * path components are used to "walk" the object to that 
         * property.
         * 
         * @function setProp
         * 
         * @param {object} obj - the object in which to set the property
         * @param {string|string[]} path - the property path on which to
         * set the property value
         * @param {any} value - the value to set on the property
         * 
         * @static
         */
        setProp: {
            value: function (path, value) {
                if (typeof path === 'string') {
                    path = path.split('.');
                }
                if (path.length === 0) {
                    return;
                }
                // pop off the last property for setting at the end.
                var propKey = path.pop(),
                    key;
                // Walk the path, creating empty objects if need be.
                var obj = this.state;
                while (path.length > 0) {
                    key = path.shift();
                    if (obj[key] === undefined) {
                        obj[key] = {};
                    }
                    obj = obj[key];
                }
                // Finally set the property.
                obj[propKey] = value;
                return value;
            }
        },
        /**
         * Increments a numeric property by a 1 or a given optional value.
         * Creates the property if it does not exist, setting the initial
         *  value to the increment value.
         * 
         * @function incrProp
         * 
         * @param {object} obj - the object on which to increment the property
         * @param {string|string[]} path - the property path on which to 
         * increment the property
         * @param {value} [increment=1] - the value by which to increment
         * the property
         * 
         * @returns {number|undefined} the new value of the incremented 
         * property or undefined if an invalid property is supplied.
         * 
         * @throws {TypeError} Thrown if the target property contains a
         * non-numeric value.
         * 
         * @example
         * var obj = {cars: 0};
         * Utils.incrProp(obj, cars);
         * // {cars: 1}
         * 
         * @example
         * var obj = {countdown: 10};
         * Utils.incrProp(obj, countdown, -1);
         * // {countdown: 9}
         * 
         * @static
         */
        incrProp: {
            value: function (path, increment) {
                if (typeof path === 'string') {
                    path = path.split('.');
                }
                if (path.length === 0) {
                    return;
                }
                increment = (increment === undefined) ? 1 : increment;
                var propKey = path.pop(),
                    key;
                var obj = this.state;
                while (path.length > 0) {
                    key = path.shift();
                    if (obj[key] === undefined) {
                        obj[key] = {};
                    }
                    obj = obj[key];
                }
                if (obj[propKey] === undefined) {
                    obj[propKey] = increment;
                } else {
                    if (typeof obj[propKey] === 'number') {
                        obj[propKey] += increment;
                    } else {
                        throw new Error('Can only increment a number');
                    }
                }
                return obj[propKey];
            }
        },
        /**
         * For a given object delets a property specified by a path 
         * 
         * @function deleteProp
         * 
         * @param {object} - the object on which to remove the property
         * @param {string|string[]} - the property specified as a path to delete
         * 
         * @returns {boolean} - true if the deletion was carried out, false
         *  if the property could not be found.
         *  
         * @example
         * var obj = {pets: {fido: {type: 'dog'}, {spot: {type: 'lizard'}}};
         * U.deleteProp(obj, 'pets.spot');
         * // {pets: {fido: {type: 'dog'}}}
         *  
         * @static
         */
        deleteProp: {
            value: function ( path) {
                if (typeof path === 'string') {
                    path = path.split('.');
                }
                if (path.length === 0) {
                    return;
                }
                var propKey = path.pop(),
                    key;
                var obj = this.state;
                while (path.length > 0) {
                    key = path.shift();
                    if (obj[key] === undefined) {
                        return false;
                    }
                    obj = obj[key];
                }
                delete obj[propKey];
                return true;
            }
        },
        
        /**
         * Given two objects, overlays the second on top of the first, 
         * ensuring that any property on the second exists on the first, 
         * creating or overwriting properties as necessary.
         * Why another mix/extend/merge? I wanted to be in control of 
         * policy regarding the overwriting, or not, of properties.
         * E.g. I consider null to be a value indicating lack of any
         * other value, whereas undefined indicates no value, but we
         * don't know whether it might have a value.
         * 
         * @function merge
         * 
         * @param {object} objA - the target object, will be modified
         * @param {object} objB - the source object
         * 
         * @returns {object} - the merged object
         * 
         * @throws {TypeError} if a destination property value cannot 
         * support a sub-property, yet the merge calls for it.
         * 
         * @static
         */
        mergeInto: {
            value: function (objB) {
                var objA = this.state;
                var Merger = {
                    init: function (obj) {
                        this.dest = obj;
                        return this;
                    },
                    getType: function (x) {
                        var t = typeof x;
                        if (t === 'object') {
                            if (x === null) {
                                return 'null';
                            } else if (x.pop && x.push) {
                                return 'array';
                            } else {
                                return 'object';
                            }
                        } else {
                            return t;
                        }
                    },
                    merge: function (dest, obj) {
                        this.dest = dest;
                        switch (this.getType(obj)) {
                            case 'string':
                            case 'integer':
                            case 'boolean':
                            case 'null':
                                throw new TypeError("Can't merge a '" + (typeof obj) + "'");
                                break;
                            case 'object':
                                return this.mergeObject(obj);
                                break;
                            case 'array':
                                return this.mergeArray(obj);
                                break;
                            default:
                                throw new TypeError("Can't merge a '" + (typeof obj) + "'");
                        }

                    },
                    mergeObject: function (obj) {
                        var keys = Object.keys(obj);
                        for (var i = 0; i < keys.length; i++) {
                            var key = keys[i];
                            var val = obj[key];
                            var t = this.getType(val);
                            switch (t) {
                                case 'string':
                                case 'number':
                                case 'boolean':
                                case 'null':
                                    this.dest[key] = val;
                                    break;
                                case 'object':
                                    if (!this.dest[key]) {
                                        this.dest[key] = {};
                                    }
                                    this.dest[key] = Object.create(Merger).init(this.dest[key]).mergeObject(obj[key]);
                                    break;
                                case 'array':
                                    if (!this.dest[key]) {
                                        this.dest[key] = [];
                                    } else {
                                        this.dest[key] = [];
                                    }
                                    this.dest[key] = Object.create(Merger).init(this.dest[key]).mergeArray(obj[key]);
                                    break;
                                case 'undefined':
                                    if (this.dest[key]) {
                                        delete this.dest[key];
                                    }
                                    break;
                            }
                        }
                        return this.dest;
                    },
                    mergeArray: function (arr) {
                        var deleted = false;
                        for (var i = 0; i < arr.length; i++) {
                            var val = arr[i];
                            var t = this.getType(val);
                            switch (t) {
                                case 'string':
                                case 'number':
                                case 'boolean':
                                case 'null':
                                    this.dest[i] = val;
                                    break;
                                case 'object':
                                    if (!this.dest[i]) {
                                        this.dest[i] = {};
                                    }
                                    this.dest[i] = Object.create(Merger).init(this.dest[i]).mergeObject(arr[i]);
                                    break;
                                case 'array':
                                    if (!this.dest[i]) {
                                        this.dest[i] = [];
                                    }
                                    this.dest[i] = Object.create(Merger).init(this.dest[i]).mergeArray(arr[i]);
                                    break;
                                case 'undefined':
                                    if (this.dest[i]) {
                                        this.dest[i] = undefined;
                                    }
                                    break;
                            }
                        }
                        if (deleted) {
                            return this.dest.filter(function (value) {
                                if (value === undefined) {
                                    return false;
                                } else {
                                    return true;
                                }
                            });
                        } else {
                            return this.dest;
                        }
                    }
                };
                return Object.create(Merger).merge(objA, objB);
            }
        }
    });

    return Props;
});