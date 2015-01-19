/*

    KBase Bootstrap plugin to handle all login/session related stuff.

    Set up a container on your HTML page. It can be whatever you'd like. For example.

    <div id = 'fizzlefazzle'></div>

    You don't need to give it that ID. I just populated it with junk because I don't want to
    encourage people to use something generic like 'login', since there's no need. You don't need
    an ID at all, just some way to select it.

    Later, in your jquery initialization, do this:

    $(function() {
        ...

        $(#"fizzlefaszzle").login();

    }

    And that, my friends, is Jenga. You're done. Sit back and enjoy the fruits of your labor.

    There are a couple of useful things to know about. You can extract the user_id and kbase_sessionid:

        $(#"fizzlefazzle").login('session', 'user_id');
        $(#"fizzlefazzle").login('session', 'kbase_sessionid');

    When you're setting it up, you have a few options:

    $('#fizzlefazzle').login(
        {
            style : (button|slim|micro|hidden) // try 'em all out! button is the default.
            loginURL : the URL we're logging into
            login_callback : a function to be called upon login, success or failure. Gets an args hash  (user_id, kbase_sessionid)
            logout_callback : a function to be called upon logout, gets no args
            prior_login_callback : a function to be called upon loading a page, if the user was already logged in. Gets an args hash (user_id, kbase_sessionid)
            user_id : a string with which to pre-populate the user_id on the forms.
        }
    );

    You can also completely inline it.

        var $login_doodad = $('<span></span>').login({style : 'hidden'});
        $login_doodad.login('login', 'username', 'password', function (args) {
            console.log("Tried to log in and got back: "); console.log(args);
        });

*/

(function($) {
  'use strict';
  $.KBWidget({

    name: "kbaseLogin",

    version: "1.1.0",
    options: {
      style: 'text',
      //loginURL : "http://140.221.92.231/services/authorization/Sessions/Login",
      loginURL: "https://kbase.us/services/authorization/Sessions/Login",
      possibleFields: ['verified', 'name', 'opt_in', 'kbase_sessionid', 'token', 'groups', 'user_id', 'email', 'system_admin'],
      fields: ['name', 'kbase_sessionid', 'user_id', 'token']
    },

    cookieName: 'kbase_session',
    narrCookieName: 'kbase_narr_session',

    sessionObject: null,
    userProfile: null,

    get_kbase_cookie: function(field) {
      // NB: do we want to support components that may need to refresh based on a change in cookie state during this
      // page render?
      // We should probably have a timer which monitors for cookie state change and issues a logout or login event.
      this.get_session();

      if (this.sessionObject) {
        return this.sessionObject[field];
      }
    },

    is_authenticated: function() {
      // Use the presence of the primary cookie as the flag for
      // authenticated.

      if (!this.get_session()) {
        // ensure that all traces of authentication are removed.
        $.KBaseSessionSync.removeAuth();
        return false;
      } else {
        return true;
      }
    },

    /* stolen from kbaseSession */
    decodeToken: function(token) {
      var parts = token.split('|');
      var map = {};
      for (var i = 0; i < parts.length; i++) {
        var fieldParts = parts[i].split('=');
        var key = fieldParts[0];
        var value = fieldParts[1];
        map[key] = value;
      }
      return map;
    },

    decodeSessionString: function(s) {
      var session = this.decodeToken(s);
      if (session.token) {
        session.token = session.token.replace(/PIPESIGN/g, '|').replace(/EQUALSSIGN/g, '=');
        session.tokenObject = this.decodeToken(session.token);
      }
      return session;
    },

    set_session_from_cookie: function(cookie) {
      var sessionObject = this.decodeSessionString(cookie);
      // We need to test that the session object was created
      // by this widget -- the auth service cookie does not include
      // the token. 
      if (this.validateSession(sessionObject)) {
        this.sessionObject = sessionObject;
      } else {
        this.sessionObject = null;
        KBaseSessionSync.removeAuth();
      }
      return this.sessionObject;
    },

    load_session: function() {
      var cookie = $.cookie(this.cookieName);
      if (!cookie) {
        return null;
      }
      this.set_session_from_cookie(cookie);
      
      // The profile is loaded asynchronously, but that is the best we can do
      // since session setup is synchronous in the app.
      var widget = this;
      
      require(['kbaseutils', 'kbaseuserprofileserviceclient', 'kbaseuserprofile', 'kbasesession', 'json!functional-site/config.json'],
        function(Utils, UserProfileService, UserProfile, Session, Config) {
          Session.refreshSession();
          var userProfile = Object.create(UserProfile).init({
            username: Session.getUsername()
          });
          userProfile.loadProfile()
            .then(function(profile) {
              switch (profile.getProfileStatus()) {
                case 'stub':
                case 'profile':
                  widget.userProfile = profile.getProfile();
                  // widget.trigger('profileLoaded', widget);
                  break;
                case 'none':
                  widget.trigger('error', 'No profile found for user');
                  break;
              }
            })
            .
          catch (function(err) {
            widget.trigger('error', 'Error getting user profile.');
          })
            .done();
        });
    },

    get_session: function(options) {
      if (options && options.force) {
        this.sessionObject = null;
      }
      if (this.sessionObject) {
        if (this.validateSession()) {
          return this.sessionObject;
        }
      }
      this.load_session();
      return this.sessionObject;
    },

    get_session_prop: function(name) {
      this.get_session();
      
      if (this.sessionObject) {
        return this.sessionObject[name];
      }
    },

    sessionId: function() {
      return this.get_session_prop('kbase_sessionid');
    },

    token: function() {
      return this.get_session_prop('token');
    },

    /**
     * Token validity is tested by the 'expiry' tag in the token.
     * That tag is followed by the number of seconds in the time when it expires.
     * So, pull that out, multiply x1000, and make a Date() out of it. If that Date is greater than
     * the current one, it's still good.
     * If not, or if there is no 'expiry' field, it's not a valid token.
     */
    hasExpired: function(sessionObject) {
      // NB: missing or invalid expiry count as expired (invalid).
      var expirySec = sessionObject.tokenObject.expiry;
      if (!expirySec) {
        return true;
      }
      expirySec = parseInt(expirySec);
      if (isNaN(expirySec)) {
        return true;
      }
      var expiryDate = new Date(expirySec * 1000);
      var diff = expiryDate - new Date();
      if (diff <= 0) {
        return true;
      } else {
        return false;
      }
    },

    validateSession: function(sessionObject) {
      if (sessionObject === undefined) {
        sessionObject = this.sessionObject;
      }
      if (!sessionObject) {
        return false;
      }
      if (!(sessionObject.kbase_sessionid && sessionObject.un && sessionObject.user_id && sessionObject.token && sessionObject.tokenObject)) {
        return false;
      }
      if (this.hasExpired(sessionObject)) {
        return false;
      }
      return true;
    },

    init: function(options) {
      this._super(options);

      // SYNC WARNING
      // There may be parts of the systCopaem which rely on the sycnronous loading characterstics of 
      // this plugin. Specifically, it has traditionally loaded early in the index page, so the 
      // session information is available to code which loads later.
      // Most of the session logic is now in kbaseSession.js, which is asynchronous in nature 
      // (requirejs loaded). However, there is a small version of the session code in kbaseSessionSync.js
      // which should be loaded towards the top of the index file, certainly before this one.
      // syncronously load the session.
      

      // Select which version of the widget to show.
      this.$elem.empty();
      var style = '_' + this.options.style + 'Style';
      this.ui = this[style]();
      if (this.ui) {
        this.$elem.append(this.ui);
      }
      
      // EVENT LISTENERS
      
      // These need to go after the elementis built, but before session is 
      // set up below, because the widget may need to respond to login and profile events.
      $(document).on('profileLoaded', function(e, profile) {
        this.userProfile = profile;
        this.data("loggedinuser_id").html(this.getUserLabel());
      }.bind(this));

      $(document).on('loggedIn', function(e, session) {
        this.sessionObject = session;
        this.data("loggedinuser_id").html(this.getUserLabel());
        this.fetchUserProfile();
      }.bind(this));
      
      this.sessionObject = Object.create($.KBaseSessionSync).init().sessionObject;
      if (!this.sessionObject) {
        $.KBaseSessionSync.removeAuth();
      } else { 
        if (this.registerLogin) {
          this.registerLogin();
        }
      
        if (this.options.prior_login_callback) {
          this.options.prior_login_callback.call(this, sessionObject);
        }
        
        // Funny, loggedIn called when the session is loaded/
        // TODO: this should be something like sessionLoaded or sessionAvailable
        this.trigger('loggedIn', this.sessionObject);
      }

      
      $(document).on(
        'loggedInQuery.kbase',
        $.proxy(function(e, callback) {
          if (callback) {
            callback(this.sessionObject);
          }
        }, this)
      );

      $(document).on(
        'promptForLogin.kbase',
        $.proxy(function(e, args) {
          if (args.user_id) {
            this.data('passed_user_id', args.user_id);
          }
          this.openDialog();
        }, this)
      );

      $(document).on(
        'logout.kbase',
        $.proxy(function(e, rePrompt) {
          this.logout(rePrompt);
        }, this)
      ); 
      
      // Finally listen for user activity in order to tickle the session.
      // But only tickle at the most every 5 seconds.
      
      var activity = false;
      $(document).on('mousemove keydown', function (e) {
        activity = true;       
      }.bind(this));
      
      var checkInterval  = 5000;
      window.setInterval(function (e) {
        if (activity) {
          activity = false;
          console.log('tickling at ' + (new Date()).getTime());
          this.tickleSession();
        }
      }.bind(this), checkInterval);

      return this;

    },
    
    tickleSession: function () {
      require(['kbasesession'], function (Session) {
        Session.setAuthCookie();
      })
    },

    registerLoginFunc: function() {
      return this.registerLogin
    },
    specificLogoutFunc: function() {
      return this.specificLogout
    },

    populateLoginInfo: function(args) {
      if (this.sessionObject) {
        // this.data('_session', this.sessionObject);
        this._error = null;
      } else {
        // this.data('_session', null);
        this._error = args.message;
      }
    },

    /* session : function(key, value) {

            if (!this.data('_session')) {
                this.data('_session', {});
            }

            var session = this.data('_session');

            if (arguments.length == 2) {
                session[key] = value;
            }

            if (arguments.length > 0) {
                return session[key];
            }
            else {
                return session;
            }
        },
          */

    error: function(new_error) {
      if (new_error) {
        this._error = new_error;
      }
      return this._error;
    },

    getUserLabel: function() {
      if (this.userProfile) {
        var name = this.userProfile.user.realname + '<br>' + this.userProfile.user.username;
      } else {
        var name = this.sessionObject.user_id;
      }
      return name;
    },

    openDialog: function() {
      if (this.data('loginDialog')) {
        var $ld = this.data('loginDialog');
        $('form', $ld.dialogModal()).get(0).reset();
        var userId = this.get_session_prop('user_id') || this.data('passed_user_id') || this.options.user_id;
        $ld.dialogModal().data("user_id").val(userId);
        delete this.options.user_id;
        // this.session('user_id',undefined);
        $ld.dialogModal().trigger('clearMessages');
        this.data('loginDialog').openPrompt();
      }
    },

    _textStyle: function() {
      this._createLoginDialog();

      this.$elem.css('padding', '9px 15px 7px 10px');

      var $prompt = $('<span></span>')
        .append(
          $('<a></a>')
          .attr('id', 'loginlink')
          .attr('href', '#')
          .text('Sign In')
          .bind('click',
            $.proxy(function(e) {
              e.preventDefault();
              e.stopPropagation();
              this.openDialog();
            }, this)
          )
      )
        .append(
          $('<div></div>')
          .addClass('btn-group')
          .attr('id', 'userdisplay')
          .css('display', 'none')
          .append(
            $('<button></button>')
            .addClass('btn btn-default')
            .addClass('btn-xs')
            .addClass('dropdown-toggle')
            .append($('<span></span>').addClass('glyphicon glyphicon-user'))
            .append($('<span></span>').addClass('caret'))
            .bind('click',
              //$.proxy(

              function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).next().toggle(); //slideToggle('fast');
              }
              //, this)
            )
          )
          .append(
            $('<ul></ul>')
            .addClass('dropdown-menu')
            .addClass('pull-right')
            .css('padding', '3px')
            .attr('id', 'login-dropdown-menu')
            .append(
              $('<li></li>')
              .css('border-bottom', '1px solid lightgray')
              .css('white-space', 'nowrap')
              .append(
                $.jqElem('div') //so as to style the link in blue.
                .css('text-align', 'right')
                .append(
                  $('<a></a>')
                  .attr('id', 'loggedinuser_id')
                  .css('font-weight', 'bold')
                  .attr('href', 'https://gologin.kbase.us/account/UpdateProfile')
                  .attr('target', '_blank')
                  .css('padding-right', '0px')
                  .css('padding-left', '0px')
                )
              )
            )
            .append(
              $('<li></li>')
              .addClass('pull-right')
              .append(
                $('<span></span>')
                .append(
                  $('<a></a>')
                  .css('padding-right', '0px')
                  .css('padding-left', '0px')
                  .append('Sign out')
                )
                .bind('click',
                  $.proxy(function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    this.data('login-dropdown-menu').hide(); //slideUp('fast');
                    this.logout();
                  }, this)
                )
              )
            )
          )
      );

      this._rewireIds($prompt, this);

      this.registerLogin = function(args) {
        if (this.sessionObject) {
          this.data("loginlink").hide();
          this.data('loggedinuser_id').html(this.getUserLabel());
          this.data("userdisplay").show();
          this.data('loginDialog').closePrompt();
        } else {
          this.data('loginDialog').dialogModal().trigger('error', args.message);
        }
      };

      this.specificLogout = function(args) {
        this.data("userdisplay").hide();
        this.data("loginlink").show();
      };

      return $prompt;

    },

    _hiddenStyle: function() {
      this._createLoginDialog();
      this.registerLogin = function(args) {
        if (args.success) {
          this.data('loginDialog').closePrompt();
        } else {
          this.data('loginDialog').dialogModal().trigger('error', args.message);
        }
      };

      return undefined;
    },

    _slimStyle: function() {
      this.data('loginDialog', undefined);

      var $prompt = $('<span></span>')
        .addClass('form-inline')
        .append(
          $('<span></span>')
          .attr('id', 'entrance')
          .append(
            $('<span></span>')
            .addClass('input-group')
            .append(
              $('<span></span>')
              .addClass('input-group-addon')
              .append('username: ')
              .bind('click',
                function(e) {
                  $(this).next().focus();
                }
              )
            )
            .append(
              $('<input>')
              .attr('type', 'text')
              .attr('name', 'user_id')
              .attr('id', 'user_id')
              .attr('size', '20')
              .val(this.options.user_id)
            )
            .append(
              $('<span></span>')
              .addClass('input-group-addon')
              .append(' password: ')
              .bind('click',
                function(e) {
                  $(this).next().focus();
                }
              )
            )
            .append(
              $('<input>')
              .attr('type', 'password')
              .attr('name', 'password')
              .attr('id', 'password')
              .attr('size', '20')
            )
            //.append('&nbsp;')
            .append(
              $('<button></button>')
              .attr('id', 'loginbutton')
              .addClass('btn btn-primary')
              .append(
                $('<i></i>')
                .attr('id', 'loginicon')
                .addClass('icon-lock')
              )
            )
          )
      )
        .append(
          $('<span></span>')
          .attr('id', 'userdisplay')
          .attr('style', 'display : none;')
          .addClass('input-group')
          .append(
            $('<span></span>')
            .addClass('input-group-addon')
            //.attr('style', 'text-align : center')
            .append('Logged in as ')
            .append(
              $('<span></span>')
              .attr('id', 'loggedinuser_id')
              .attr('style', 'font-weight : bold')
              .append('user_id\n')
            )
          )
          .append(
            $('<button></button>')
            .addClass('btn btn-default')
            .attr('id', 'logoutbutton')
            .append(
              $('<i></i>')
              .attr('id', 'logouticon')
              .addClass('icon-signout')
            )
          )
      );


      this._rewireIds($prompt, this);

      this.data('password').keypress(
        $.proxy(
          function(e) {
            if (e.keyCode == 13.) {
              this.data('loginbutton').trigger("click");
              e.stopPropagation();
            }
          },
          this
        )
      );

      this.registerLogin =
        function(args) {

          this.data('loginicon').removeClass().addClass('icon-lock');

          if (this.sessionObject) {
            this.data("entrance").hide();
            this.data('user_id').val('');
            this.data('password').val('');
            this.data("loggedinuser_id").html(this.getUserLabel());
            this.data("userdisplay").show();
          } else {

            var $errorModal = $('<div></div>').kbasePrompt({
              title: 'Login failed',
              body: $('<div></div>')
                .attr('class', 'alert alert-error')
                .append(
                  $('<div></div>')
                  .append(
                    $('<div></div>')
                    .addClass('pull-left')
                    .append(
                      $('<i></i>')
                      .addClass('icon-warning-sign')
                      .attr('style', 'float: left; margin-right: .3em;')
                    )
                  )
                  .append(
                    $('<div></div>')
                    .append(
                      $('<strong></strong>').append(args.message)
                    )
                  )
              ),
              controls: ['okayButton'],
            });
            $errorModal.openPrompt();

          }
      };

      this.specificLogout = function(args) {
        this.data("userdisplay").hide();
        this.data("entrance").show();
      };

      this.data('loginbutton').bind(
        'click',
        $.proxy(
          function(evt) {

            this.data('loginicon').removeClass().addClass('icon-refresh');

            this.login(this.data('user_id').val(), this.data('password').val(),
              function(args) {
                this.registerLogin(args);
                if (this.options.login_callback) {
                  this.options.login_callback.call(this, args);
                }
              }
            );

          },
          this
        )
      );

      this.data('logoutbutton').bind('click',
        $.proxy(
          function(e) {
            this.logout();
            this.data('user_id').focus();
          },
          this
        )
      );

      return $prompt;

    },

    _microStyle: function() {
      var $prompt = $('<span></span>')
        .append(
          $('<button></button>')
          .addClass('btn btn-primary')
          .attr('id', 'loginbutton')
          .append(
            $('<i></i>')
            .attr('id', 'loginicon')
            .addClass('icon-lock')
          )
      );

      this._rewireIds($prompt, this);

      this._createLoginDialog();

      this.data('loginbutton').bind('click',
        $.proxy(function(evt) {
          this.openDialog();
        }, this)
      );

      this.registerLogin = function(args) {
        if (this.sessionObject) {
          this.data('loginDialog').dialogModal().trigger('clearMessages');
          this.data('loginDialog').closePrompt();

          this.data('loginbutton').tooltip({
            title: 'Logged in as ' + this.userProfile.user.realname
          });

          this.data('loginicon').removeClass().addClass('icon-user');

          this.data('loginbutton').bind('click',
            $.proxy(function(evt) {
              this.logout();
            }, this));
        } else {
          this.data('loginDialog').dialogModal().trigger('error', args.message);
        }
      };

      this.specificLogout = function() {
        this.data('loginbutton').tooltip('destroy');
        this.data('loginicon').removeClass().addClass('icon-lock');
      };

      return $prompt;
    },

    _buttonStyle: function() {
      var $prompt = $('<div></div>')
        .attr('style', 'width : 250px; border : 1px solid gray')
        .append(
          $('<h4></h4>')
          .attr('style', 'padding : 5px; margin-top : 0px; background-color : lightgray ')
          .addClass('text-center')
          .append('User\n')
      )
        .append(
          $('<div></div>')
          .attr('id', 'entrance')
          .append(
            $('<p></p>')
            .attr('style', 'text-align : center')
            .append(
              $('<button></button>')
              .attr('id', 'loginbutton')
              .append('Login')
              .addClass('btn btn-primary')
            )
          )
      )
        .append(
          $('<div></div>')
          .attr('id', 'userdisplay')
          .attr('style', 'display : none;')
          .append(
            $('<p></p>')
            .attr('style', 'text-align : center')
            .append('Logged in as ')
            .append(
              $('<span></span>')
              .attr('id', 'loggedinuser_id')
              .attr('style', 'font-weight : bold')
              .append('user_id\n')
            )
            .append(
              $('<button></button>')
              .attr('id', 'logoutbutton')
              .append('Logout\n')
              .addClass('btn btn-default')
            )
          )
      );

      this._rewireIds($prompt, this);

      this._createLoginDialog();

      this.data('loginbutton').bind('click',
        $.proxy(
          function(event) {
            this.openDialog();
          },
          this
        )
      );

      this.data('logoutbutton').bind('click', $.proxy(this.logout, this));

      this.registerLogin =
        function() {
          if (this.sessionObject) {
            this.data('loginDialog').dialogModal().trigger('clearMessages');
            this.data("entrance").hide();
            this.data("loggedinuser_id").html(this.getUserLabel());
            this.data("userdisplay").show();
            this.data('loginDialog').closePrompt();
          } else {
            this.data('loginDialog').dialogModal().trigger('error', this._error);
          }
      };

      this.specificLogout = function(args) {
        this.data("userdisplay").hide();
        this.data("entrance").show();
      };

      return $prompt;
    },

    _createLoginDialog: function() {

      var $elem = this.$elem;

      var $ld = $('<div></div').kbasePrompt({
        title: 'Login to KBase',
        controls: [
          'cancelButton', {
            name: 'Login',
            type: 'primary',
            id: 'loginbutton',
            callback: $.proxy(function(e) {
              var user_id = this.data('loginDialog').dialogModal().data('user_id').val();
              var password = this.data('loginDialog').dialogModal().data('password').val();

              this.data('loginDialog').dialogModal().trigger('message', user_id);
              this.login(user_id, password, function(args) {

                if (this.registerLogin) {
                  this.registerLogin(args);
                }
                if (this.options.login_callback) {
                  this.options.login_callback.call(this, args);
                }
              }.bind(this));

            }, this)
          }
        ],
        body: $('<p></p>')
          .append(
            $('<form></form>')
            .attr('name', 'form')
            .attr('id', 'form')
            .addClass('form-horizontal')
            .append(
              $('<fieldset></fieldset>')
              .append(
                $('<div></div>')
                .attr('class', 'alert alert-error')
                .attr('id', 'error')
                .attr('style', 'display : none')
                .append(
                  $('<div></div>')
                  .append(
                    $('<div></div>')
                    .addClass('pull-left')
                    .append(
                      $('<i></i>')
                      .addClass('icon-warning-sign')
                      .attr('style', 'float: left; margin-right: .3em;')
                    )
                  )
                  .append(
                    $('<div></div>')
                    .append(
                      $('<strong></strong>')
                      .append('Error:\n')
                    )
                    .append(
                      $('<span></span>')
                      .attr('id', 'errormsg')
                    )
                  )
                )
              )
              .append(
                $('<div></div>')
                .attr('class', 'alert alert-success')
                .attr('id', 'pending')
                .attr('style', 'display : none')
                .append(
                  $('<div></div>')
                  /*.append(
                                                                $('<div></div>')
                                                                    .addClass('pull-left')
                                                                    .append(
                                                                        $('<i></i>')
                                                                            .addClass('icon-info-sign')
                                                                            .attr('style', 'float: left; margin-right: .3em;')
                                                                    )
                                                            )*/
                  .append(
                    $('<div></div>')
                    .append(
                      $('<strong></strong>')
                      .append('Logging in as:\n')
                    )
                    .append(
                      $('<span></span>')
                      .attr('id', 'pendinguser')
                    )
                  )
                )
              )
              .append(
                $('<div></div>')
                .attr('class', 'form-group')
                .append(
                  $('<label></label>')
                  .addClass('control-label')
                  .addClass('col-lg-2')
                  .attr('for', 'user_id')
                  .css('margin-right', '10px')
                  .append('Username:\n')
                )
                .append(
                  $.jqElem('div')
                  .addClass('col-lg-9')
                  .append(
                    $('<input>')
                    .addClass('form-control')
                    .attr('type', 'text')
                    .attr('name', 'user_id')
                    .attr('id', 'user_id')
                    .attr('size', '20')
                  )
                )
              )
              .append(
                $('<div></div>')
                .attr('class', 'form-group')
                .append(
                  $('<label></label>')
                  .addClass('control-label')
                  .addClass('col-lg-2')
                  .attr('for', 'password')
                  .css('margin-right', '10px')
                  .append('Password:\n')
                )
                .append(
                  $.jqElem('div')
                  .addClass('col-lg-9')
                  .append(
                    $('<input>')
                    .addClass('form-control')
                    .attr('type', 'password')
                    .attr('name', 'password')
                    .attr('id', 'password')
                    .attr('size', '20')
                  )
                )
              )
            )
        ), //body
        footer: $('<span></span')
          .append(
            $('<a></a>')
            .attr('href', 'https://gologin.kbase.us/ResetPassword')
            .attr('target', '_blank')
            .text('Forgot password?')
        )
          .append('&nbsp;|&nbsp;')
          .append(
            $('<a></a>')
            .attr('href', ' https://gologin.kbase.us/OAuth?response_type=code&step=SignUp&redirect_uri=' + encodeURIComponent(location.href))
            .attr('target', '_blank')
            .text('Sign up')
        ),
      });

      this._rewireIds($ld.dialogModal(), $ld.dialogModal());

      this.data('loginDialog', $ld);

      $ld.dialogModal().bind('error',
        function(event, msg) {
          $(this).trigger('clearMessages');
          $(this).data("error").show();
          $(this).data("errormsg").html(msg);
        }
      );

      $ld.dialogModal().bind('message',
        function(event, msg) {
          $(this).trigger('clearMessages');
          $(this).data("pending").show();
          $(this).data("pendinguser").html(msg);
        }
      );

      $ld.dialogModal().bind('clearMessages',
        function(event) {
          $(this).data("error").hide();
          $(this).data("pending").hide();
        }
      );

      $ld.dialogModal().on('shown.bs.modal',
        function(e) {

          if ($(this).data('user_id').val().length == 0) {
            $(this).data('user_id').focus();
          } else {
            $(this).data('password').focus();
          }
        }
      );
      return $ld;
    },
    
    fetchUserProfile: function () {
      require(['kbaseuserprofile', 'kbasesession'], 
      function(UserProfile, Session) {
        var userProfile = Object.create(UserProfile).init({username: Session.getUsername()});
        userProfile.loadProfile()
        .then(function(profile) {
          switch (profile.getProfileStatus()) {
            case 'stub':
            case 'profile':         
               $(document).trigger('profileLoaded', profile.getProfile());       
              break;
            case 'none':
              profile.createStubProfile({createdBy: 'session'})
              .then(function(profile) {
                $(document).trigger('profileLoaded', profile.getProfile());  
              })
              .catch (function(err) {
                 $(document).trigger('profileLoadFailure', {status : 0, message : err}); 
              })
              .done();
              break;
          }
        })
        .catch (function(err) {
          var errMsg = 'Error getting user profile';
          // KBase Event Interface
          $(document).trigger('profileLoadFailure', {status : 0, message : err}); 
        })
        .done();
      });
    },
    
    login: function(user_id, password, callback) {
      require(['kbasesession', 'q'], function(Session, Q) {
        Session.login({
          username: user_id,
          password: password,
          success: function(session) {
            // omg this is the callback protocol 
            session.status = 1;
            this.populateLoginInfo(session);
            
            callback.call(this, session);
          }.bind(this),
          error: function(err) {
            var errObject = {
              status: 0,
              message: err
            };
            this.populateLoginInfo(errObject);
            callback.call(this, errObject);
          }.bind(this)
        });
      }.bind(this));
    },

    logout: function(rePrompt) {
      require(['kbasesession'], function (Session) {
        Session.removeAuth();

        // the rest of this is just housekeeping.
        if (this.specificLogout) {
          this.specificLogout();
        }

        this.populateLoginInfo();

        //automatically prompt to log in again
        // rePrompt = false;
        // defaults to true; originally this was always set to false...
        // because I think it was disabled.
        // heck, just comment this out.
        /*
        rePrompt = false;
        if (rePrompt === undefined) {
          rePrompt = true;
        } else {
          rePrompt;
        }
        if (this.data('loginDialog') != undefined && rePrompt) {
          this.openDialog();
        }
        */

        this.trigger('loggedOut');

        if (this.options.logout_callback) {
          this.options.logout_callback.call(this);
        }
      }.bind(this));
    }

  });

}(jQuery));
