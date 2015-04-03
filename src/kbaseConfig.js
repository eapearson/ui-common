/*jslint browser: true,  todo: true, vars: true, nomen: true */
/**
 * Provides an interface to the KBase application wide configuration.
 * Note that the sole export of this module is a singleton object -- an 
 * instance of the Config object which is populated with the configuration data.
 * 
 * @module Config
 * @author Erik Pearson <eapearson@lbl.gov>
 * @version 0.0.3
 * 
 * @todo testing
 * @todo documentation
 */

define(['kb.utils'],
    function (Utils) {
        'use strict';
        /**
         * Provides an object which services as an interface to the kbase configuration.
         * 
         * @exports Config/Config
         * 
         */
        var Config = Object.create({}, {
            /**
             * The configuration object.
             * @member {object} config
             */
            config: {
                set: function (value) {
                    this._config = value;                    
                },
                get: function () {
                    return this._config;
                }
            },
            /**
             * Object initializer.
             * 
             * @function init
             * @public
             * 
             * @returns {this}
             */
            init: {
                value: function (cfg) {
                    if (cfg && cfg.config) {
                        this.config = cfg.config;
                    } else {
                        this.config = {};
                    }
                    return this;
                }
            },
            /**
             * Get a configuration value for a given property path
             * 
             * @function getConfig
             * @public
             * 
             * @param {PropertyPath} path - the path at which to find the configuration
             * property within the configuration.
             * @param {Any} defaultValue - some value to return in case the property
             * is not found.
             * 
             * @returns {Any} the value found at the given path, or the defaultValue if provided.
             */
            getConfig: {
                value: function (path, defaultValue) {
                    return Utils.getProp(this.config, path, defaultValue);
                }
            },
            /**
             * Set a configuration value on a given path.
             * Note that if the given property does not exist, the property, and
             * any containing property objects, will be created.
             * Note: this should only be used for testing purpopses.
             * 
             * @function setConfig
             * @public
             * 
             * @param {PropertyPath} path - the path at which to set the value.
             * @param {Any} value - the value to set.
             * 
             * @returns {undefined} nothing
             */
            setConfig: {
                value: function (key, value) {
                    Utils.setProp(this.config, key, value);
                }
            },
            /**
             * Determine if a given configuration property actually exists.
             * This is useful when strict presence of a configuration property
             * is necessary.
             * 
             * @function hasConfig
             * @public
             * 
             * @param {PropertyPath} path - the path at which to look for a property
             * 
             * @returns {Boolean} true if the property path contains a property value, false otherwise.
             * 
             */
            hasConfig: {
                value: function (key) {
                    return Utils.hasProp(this.config, key);
                }
            }
        });
        return {
            Config: Config
        };
    });