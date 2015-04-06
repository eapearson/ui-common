/*global define: true */
/*jslint browser:true  vars: true */
define(['postal', 'kb.widget.base', 'kb.session'],
    function (Postal, BaseWidget, Session) {
        "use strict";
        var W = Object.create(BaseWidget, {
            /**
             * The semantic version of this module.
             * 
             */
            version: {
                value: '0.0.1',
                writable: false
            },
            /**
             * Initialize runtime properties.
             * 
             * @function init
             * @public
             * 
             * @param {object} cfg
             */
            init: {
                value: function (cfg, params) {
                    // Looks like a widget ... acts like a widget ...
                    cfg.title = 'Login Form Widget';
                    cfg.name = 'LoginForm';
                    cfg.collection = 'login';
                    this.BaseWidget_init(cfg, params);

                    this.templates.env.addFilter('kbmarkup', function (s) {
                        if (s) {
                            s = s.replace(/\n/g, '<br>');
                        }
                        return s;
                    });

                    return this;
                }
            },
            /**
             * Return the version of this object.
             * 
             * @function getVersion
             * @returns {string} - the semantic version of this object
             */
            getVersion: {
                value: function () {
                    return this.version;
                }
            },
            
            setInitialState: {
                value: function (options) {
                    // The base method just resolves immediately (well, on the next turn.) 
                    return Q.Promise(function (resolve) {
                        resolve();
                    }.bind(this));
                }
            },
            
            // Set up things post-start. Events, ec.
            afterStart: {
                value: function () {
                    // Set up delegated events to handle login.
                    // TODO: This should really be installed and uninstalled with the view...
                    var widget = this;
                    this.container.on('submit', '[name="login-form"]', function (e) {
                        e.preventDefault();
                        widget.onLogin();
                    });
                }
            },
            // Stop things that we started before, such as event handlers. Called prior to destroy.
            onStop: {
                value: function () {
                    
                }
            },
            // my event handlers.
            onLogin: {
                value: function () {
                    this.container.find('[data-element="loading-indicator"]').show();
                    this.container.find('[data-element="login-error"]').html('');
                    this.container.find('[data-element="login-error"]').hide();
                    
                    var username = this.container.find('form[name="login-form"] input[name="username"]').val();
                    var password = this.container.find('form[name="login-form"] input[name="password"]').val();
                    var nextAppURL = this.container.find('form[name="login-form"] input[name="nextAppURL"]').val();
                    var nextURL = this.container.find('form[name="login-form"] input[name="nextUrl"]').val();
                    
                    Session.login({
                        username: username,
                        password: password
                    })
                    .then(function (session) {
                        Postal.channel('session').publish('login.success', {
                            session: Session,
                            nextAppURL: nextAppURL,
                            nextURL: nextURL
                        });
                    })
                    .catch(function (errorMsg) {
                        // All error handling is handled locally.
                        this.container.find('[data-element="loading-indicator"]').hide();
                        if (errorMsg === "LoginFailure: Authentication failed.") {
                            errorMsg = "Login Failed: your username/password is incorrect.";
                        }
                        this.container.find('[data-element="login-error"]').html(errorMsg);
                        this.container.find('[data-element="login-error"]').show();
                    }.bind(this))
                    .done();
                }
            }
        });
            
        return W;
    });