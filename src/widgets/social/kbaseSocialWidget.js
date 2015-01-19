define(['nunjucks', 'jquery', 'q', 'kbasesession', 'kbaseutils', 'json!functional-site/config.json'],
  function(nunjucks, $, Q, Session, Utils, config) {
    "use strict";
    var SocialWidget = Object.create({}, {

      // The init function interfaces this object with the caller, and sets up any 
      // constants and constant state.
      SocialWidget_init: {
        value: function(cfg) {
          this._generatedId = 0;

          // First we get the global config.
          
          // The global config is derived from the module definition, which gets it from the 
          // functional site main config file directly. The setup property of the config defines
          // the current set of settings (production, development, etc.)
          this.globalConfig = config[config.setup];
          
          // TODO: implement local config and config merging.
          this.localConfig = {};        
          this.initConfig = cfg || {};
          this.setupConfig(); 

          // PARAMS          
          // The params object is used to hold any parameterized input.
          // Note that params may change. E.g. the user may select another 
          // member profile to view.
          this.params = {};

          // Also the userId is required -- this is the user for whom the social widget is concerning.
          this.params.userId = cfg.userId;
          
          
          // AUTH
          // Auth information is derived from the auth widget.
          // Auth state can change at any time -- the syncAuth method knows how to 
          // rebuild the widget after auth state change.
          this.setupAuth();

          
          // Set up widget based on the config, params, and auth.
          this.setupCoreApp();
          
          this.setup();
          
          
          // MESSAGES
          // The widget supports arbitrary messages provided by the widget code to the
          // interface. A simple list.
          this.messages = [];
          
          // ERROR
          this.error = null;
          
          // The state object is used to hold any data generated by this 
          // widget.
          // It is merged onto the context object prior to rendering.
          // state is either: none, initialized, changed, 
          this.state = {};
          this.stateMeta = {
            status: 'none',
            timestamp: new Date()
          }
          
          // Creates maps out of lists.
          this.createListMaps();

          // Set up the templating system.
          // NB the templating requires a dedicated widget resources directory in 
          //   /src/widgets/WIDGETNAME/templates
          this.templates = {};
          this.templates.env = new nunjucks.Environment(new nunjucks.WebLoader('/src/widgets/social/' + this.widgetName + '/templates'), {
            'autoescape': false
          });
          this.templates.env.addFilter('kbmarkup', function(s) {
            if (s) {
              s = s.replace(/\n/g, '<br>');
            }
            return s;
          });
          // This is the cache of templates.
          this.templates.cache = {};

          // The context object is what is given to templates.
          this.context = {};
          this.context.env = {
            
            widgetTitle: this.widgetTitle,
            widgetName: this.widgetName
          };
          // NB this means that when clearing state or params, the object
          // should not be blown away.
          this.context.state = this.state;
          this.context.params = this.params;


          // Set up listeners for any kbase events we are interested in:
          // NB: following tradition, the auth listeners are namespaced for kbase; the events
          // are not actually emitted in the kbase namespace.
          $(document).on('loggedIn.kbase', function(e, auth) {
            this.onLoggedIn(e, auth);
          }.bind(this));

          $(document).on('loggedOut.kbase', function(e, auth) {
            this.onLoggedOut(e, auth);
          }.bind(this));

          return this;
        }
      },
      
      setupConfig: {
        value: function () {
          
          this.configs = [{}, this.initConfig, this.localConfig, this.globalConfig];
          
          // Check for required and apply defaults.
          if (!this.hasConfig('container')) {
            throw 'A container is required by this Widget, but was not provided.';
          }
          
          if (!this.hasConfig('name')) {
            throw 'Widget name is required';
          }
          
          if (!this.hasConfig('title')) {
            throw 'Widget title is required';
          }
          
          // Then apply defaults.
          if (!this.hasConfig('ajaxTimeout')) {
            this.setConfig('ajaxTimeout', 10000);
          }
        }
      },

      setupCoreApp: {
        value: function() {
          // Should be run after configuration changes.
          // May touch parts of the widget object, so care should be taken
          // to syncronize or just plain rebuild.
         
          this.container = this.getConfig('container');
          if (typeof this.container === 'string') {
            this.container = $(this.container);
          }

          // OTHER CONFIG
          // The widget requires a name to use for various purposes.
          this.widgetName = this.getConfig('name');

          this.widgetTitle = this.getConfig('title');
          
          
          this.instanceId = this.genId();   
          
          $.ajaxSetup({
            timeout: this.getConfig('ajaxTimeout')
          });
                   
          return;
        }
      },

      setupAuth: {
        value: function() {
          Session.refreshSession();
        }
      },

      // LIFECYCLE

      start: {
        value: function() {          
          // This creates the initial UI -- loads the css, inserts layout html.
          // For simple widgets this is all the setup needed.
          // For more complex one, parts of the UI may be swapped out.
          this.setupUI();
          this.renderWaitingView();

          this.setInitialState()
          .then(function() {
            return this.refresh()
          }.bind(this))
          .catch(function(err) {
            this.setError(err);
          }.bind(this))
          .done();
        }
      },
      
      setup: {
        value: function () {
          // does whatever the widget needs to do to set itself up
          // after config, params, and auth have been configured.
          
          return this;
        }
      },

      setupUI: {
        value: function() {
          this.loadCSS();
          this.renderLayout();
          return this;
        }
      },

      stop: {
        value: function() {
          // ???
        }
      },

      destroy: {
        value: function() {
          // tear down any events, etc. that are not attached
          // to the local container.
        }
      },

      // CONFIG
      getConfig: {
        value: function(key, defaultValue) {
          for (var i=0; i<this.configs.length; i++) {
            if (Utils.getProp(this.configs[i], key) !== undefined) {
              return Utils.getProp(this.configs[i], key);
            } 
          }
          return defaultValue;
        }
      },
      
      setConfig: {
        value: function (key, value) {
          // sets it on the first config, which is the override config.
          Utils.setProp(this.configs[0], key,  value);
        }
      },

      hasConfig: {
        value: function(key) {
          for (var i=0; i<this.configs.length; i++) {
            if (Utils.getProp(this.configs[i], key) !== undefined) {
              return true;
            } 
          }
          return false;
        }
      },



      // PARAMETERS
      // Parameters are typically passed into the init() method, and represent external values that vary for each 
      // new object. Typical use cases are url query variables.
      setParam: {
        value: function(path, value) {
          Utils.setProp(this.params, path, value);
          this.refresh().done();
        }
      },

      recalcState: {
        value: function() {
          this.setInitialState()
          .then(function() {
            return this.refresh();
          }.bind(this))
          .catch (function(err) {
            this.setError(err);
          }.bind(this))
          .done();
        }
      },

      refresh: {
        value: function() {
          return Q.Promise(function (resolve, reject, notify) {
            if (!this.refreshTimer) {
              this.refreshTimer = window.setTimeout(function() {
                this.refreshTimer = null;
                this.render();
                resolve();
              }.bind(this), 0);
            }
          }.bind(this));
        }
      },


      // STATE CHANGES

      /*
        getCurrentState
        This should do prepare the internal state to the point at
        which rendering can occur. It will typically fetch all data and stache it, 
        and perhaps perform some rudimentary analysis.
        */
      setState: {
        value: function(path, value, norefresh) {
          Utils.setProp(this.state, path, value);
          if (!norefresh) {
            this.refresh().done();
          }
        }
      },
      
      setError: {
        value: function(errorValue) {
          if (!errorValue) {
            return;
          }
            
          var errorText;
          if (typeof errorValue === 'string') {
            errorText = errorValue;
          } else if (typeof errorValue === 'object') {
            if (errorValue.message) {
              errorText = errorValue.message;
            } else {
              errorText = '' + error;
            }
          }
          this.error = {
            message: errorText,
            original: errorValue
          }
          this.refresh().done();
        }
      },
      
      checkState: {
        value: function (status) {
          if (this.stateMeta.status === status) {
            return true;
          } else {
            return false;
          }
        }
      },

     
      promise: {
        value: function(client, method, arg1) {
          var def = Q.defer();
          client[method](arg1,
            function(result) {
              def.resolve(result);
            },
            function(err) {
              def.reject(err);
            });
          return def.promise;
        }
      },

      setInitialState: {
        value: function(options) {
          // The base method just resolves immediately (well, on the next turn.) 
          return Q.Promise(function (resolve, reject, notify) {
            resolve();
          });
        }
      },

      // EVENT HANDLERS

      onLoggedIn: {
        value: function(e, auth) {
          this.setupAuth();
          this.setup();
          this.setInitialState({force: true})
          .then(function () {
            this.refresh();
          }.bind(this));
        }
      },

      onLoggedOut: {
        value: function(e, auth) {
          this.setupAuth();
          this.setup();
          this.setInitialState({force: true}).then(function () {
            this.refresh();
          }.bind(this));
        }
      },

      // STATE CALCULATIONS

      // TEMPLATES
      getTemplate: {
        value: function(name) {
          if (this.templates.cache[name] === undefined) {
            this.templates.cache[name] = this.templates.env.getTemplate(name + '.html');
          }
          return this.templates.cache[name];
        }
      },

      createTemplateContext: {
        value: function(additionalContext) {
          /*
            var context = this.merge({}, this.context);
            return this.merge(context, {
              state: this.state, 
              params: this.params
            })
            */
          
          // We need to ensure that the context reflects the current auth state.
          this.context.env.loggedIn = Session.isLoggedIn();
          if (Session.isLoggedIn()) {
            this.context.env.loggedInUser = Session.getUsername();
            //this.context.env.loggedInUserRealName = Session.getUserRealName();
          } else {
            delete this.context.env.loggedInUser;
            //delete this.context.env.loggedInUserRealName;
          }
          
          this.context.env.instanceId = this.instanceId;
          
          this.context.env.isOwner = this.isOwner();
          
          if (additionalContext) {
            var temp = Utils.merge({}, this.context);
            return Utils.merge(temp, additionalContext);
          } else {
            return this.context;
          }
        }
      },

      renderTemplate: {
        value: function(name, context) {
          var template = this.getTemplate(name);
          if (!template) {
            throw 'Template ' + name + ' not found';
          }
          var context = context ? context : this.createTemplateContext();
          return template.render(context);
        }
      },

      // Generates a unique id for usage on synthesized dom elements.
      genId: {
        value: function() {
          return 'gen_' + this.widgetName + '_' + this._generatedId++;
        }
      },
      
      renderError: {
        value: function() {          
          var context = this.createTemplateContext({
            error: {
              message: Utils.getProp(this.error, 'message')
            }
          });
          this.places.content.html(this.getTemplate('error').render(context));
        }
      },

      renderErrorView: {
        value: function(error) {
          // Very simple error view.
          
          if (error) {
            var errorText;
            if (typeof error === 'string') {
              errorText = error;
            } else if (typeof error === 'object') {
              if (error instanceof Error) {
                errorText = error.message;
              } else {
                error = '' + error;
              }
            }
          }
          
          var context = this.createTemplateContext({
            error: errorText
          });
          this.places.content.html(this.getTemplate('error').render(context));
        }
      },

      niceElapsedTime: {
        value: function(dateString) {
          // need to strip off the timezone from the string.
          var isoRE = /(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)([\+\-])(\d\d\d\d)/;
          var dateParts = isoRE.exec(dateString);
          if (!dateParts) {
            return '** Invalid Date Format **';
          } else if (dateParts[8] !== '0000') {
            return '** Invalid Date TZ Offset ' + dateParts[8] + ' **';
          }

          var newDateString = dateParts[1] + '-' + dateParts[2] + '-' + dateParts[3] + 'T' + dateParts[4] + ':' + dateParts[5] + ':' + dateParts[6];

          var d = new Date(newDateString);
          var shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

          var time = "";
          var minutes = d.getMinutes();
          if (minutes < 10) {
            minutes = "0" + minutes;
          }
          if (d.getHours() >= 12) {
            if (d.getHours() != 12) {
              time = (d.getHours() - 12) + ":" + minutes + "pm";
            } else {
              time = "12:" + minutes + "pm";
            }
          } else {
            time = d.getHours() + ":" + minutes + "am";
          }
          return shortMonths[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear() + " at " + time;
        }
      },

      


     
      
      isOwner: {
        value: function(paramName) {
          // NB param name represents the property name of the parameter which currently 
          // holds the username of the "subject" of the widget. If the current authenticated
          // user and the subject user are the same, we say the user is the owner.
          // The widgets use 'userId', which originates in the url as a path component,
          // e.g. /people/myusername.
          paramName = paramName ? paramName : 'userId';
          if (Session.isLoggedIn() && Session.getUsername() === this.params[paramName]) {
            return true;
          } else {
            return false;
          }
        }
      },
      


      // DOM UPDATE

      // An example universal renderer, which inspects the state of the widget and
      // displays the appropriate content.
      render: {
        value: function() {
          // Generate initial view based on the current state of this widget.
          // Head off at the pass -- if not logged in, can't show profile.
          if (this.error) {
            this.renderError();
          } else if (Session.isLoggedIn()) {
            this.places.title.html(this.widgetTitle);
            this.places.content.html(this.renderTemplate('authorized'));
          } else {
            // no profile, no basic aaccount info
            this.places.title.html(this.widgetTitle);
            this.places.content.html(this.renderTemplate('unauthorized'));
          }
          return this;
        }
      },

      // These are some very basic renderers for common functions. 

      // This can provide an initial layout, such as a panel, and provide container nodes,
      // such as title and content.
      renderLayout: {
        value: function() {
          this.container.html(this.getTemplate('layout').render(this.createTemplateContext()));
          this.places = {
            title: this.container.find('[data-placeholder="title"]'),
            alert: this.container.find('[data-placeholder="alert"]'),
            content: this.container.find('[data-placeholder="content"]')
          };
        }
      }, 

      // Render a waiting icon while.
      // This is typically done before getCurrentState which might be doing a time consuming ajax call
      // to fetch data.
      // NB depends on assets.
      renderWaitingView: {
        value: function() {
          this.places.content.html('<img src="assets/img/ajax-loader.gif"></img>');
        }
      },

      loadCSS: {
        value: function() {
          // Load social widget css.
          $('<link>')
          .appendTo('head')
          .attr({type: 'text/css', rel: 'stylesheet'})
          .attr('href', '/src/widgets/social/style.css');
          // Load specific widget css.
          $('<link>')
          .appendTo('head')
          .attr({type: 'text/css', rel: 'stylesheet'})
          .attr('href', '/src/widgets/social/' + this.widgetName + '/style.css');
        }
      },

      renderMessages: {
        value: function() {
          if (this.places.alert) {
            this.places.alert.empty();
            for (var i = 0; i < this.messages.length; i++) {
              var message = this.messages[i];
              var alertClass = 'default';
              switch (message.type) {
                case 'success':
                  alertClass = 'success';
                  break;
                case 'info':
                  alertClass = 'info';
                  break;
                case 'warning':
                  alertClass = 'warning';
                  break;
                case 'danger':
                case 'error':
                  alertClass = 'danger';
                  break;
              }
              this.places.alert.append(
                '<div class="alert alert-dismissible alert-' + alertClass + '" role="alert">' +
                '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
                '<strong>' + message.title + '</strong> ' + message.message + '</div>');
            }
          }
        }
      },

      clearMessages: {
        value: function() {
          this.messages = [];
          this.renderMessages();
        }
      },

      addSuccessMessage: {
        value: function(title, message) {
          if (message === undefined) {
            message = title;
            title = '';
          }
          this.messages.push({
            type: 'success',
            title: title,
            message: message
          });
          this.renderMessages();
        }
      },

      addWarningMessage: {
        value: function(title, message) {
          if (message === undefined) {
            message = title;
            title = '';
          }
          this.messages.push({
            type: 'warning',
            title: title,
            message: message
          });
          this.renderMessages();
        }
      },

      addErrorMessage: {
        value: function(title, message) {
          if (message === undefined) {
            message = title;
            title = '';
          }
          this.messages.push({
            type: 'error',
            title: title,
            message: message
          });
          this.renderMessages();
        }
      },

      makeWorkspaceObjectId: {
        value: function(workspaceId, objectId) {
          return 'ws.' + workspaceId + '.obj.' + objectId;
        }
      },

      // KBase Service Utility Methods
      // NB: these should really be contained in the service apis, but those are automatically generated.
      // Maybe a kbase services utility module?
      workspace_metadata_to_object: {
        value: function(wsInfo) {
          return {
            id: wsInfo[0],
            name: wsInfo[1],
            owner: wsInfo[2],
            moddate: wsInfo[3],
            object_count: wsInfo[4],
            user_permission: wsInfo[5],
            globalread: wsInfo[6],
            lockstat: wsInfo[7],
            metadata: wsInfo[8]
          };
        }
      },

      narrative_info_to_object: {
        value: function(data) {
          return {
            id: data[0],
            name: data[1],
            type: data[2],
            save_date: data[3],
            version: data[4],
            saved_by: data[5],
            wsid: data[6],
            ws: data[7],
            checksum: data[8],
            size: data[9],
            metadata: data[10],
            ref: data[7] + '/' + data[1],
            obj_id: 'ws.' + data[6] + '.obj.' + data[0] 
          };
        }
      },

      logNotice: {
        value: function (source, message) {
          console.log('NOTICE: ['+source+'] ' + message);          
        }
      },
      
      logDeprecation: {
        value: function (source, message) {
          console.log('DEPRECATION: ['+source+'] ' + message);          
        }
      },
      
      logWarning: {
        value: function (source, message) {
          console.log('WARNING: ['+source+'] ' + message);          
        }
      },
      logError: {
        value: function (source, message) {
          console.log('ERROR: ['+source+'] ' + message);          
        }
      },
      
      createListMaps: {
        value: function() {
          this.listMaps = {};
          for (var listId in this.lists) {
            var list = this.lists[listId];

            this.listMaps[listId] = {};

            for (var i in list) {
              this.listMaps[listId][list[i].id] = list[i];
            }
          }
        }
      },
      
      lists: {
        value: {
          userRoles: [{
            id: 'pi',
            label: 'Principal Investigator'
          }, {
            id: 'gradstudent',
            label: 'Graduate Student'
          }, {
            id: 'developer',
            label: 'Developer'
          }, {
            id: 'tester',
            label: 'Tester'
          }, {
            id: 'documentation',
            label: 'Documentation'
          }, {
            id: 'general',
            label: 'General Interest'
          }],
          userClasses: [{
            id: 'pi',
            label: 'Principal Investigator'
          }, {
            id: 'gradstudent',
            label: 'Graduate Student'
          }, {
            id: 'kbase-internal',
            label: 'KBase Staff'
          }, {
            id: 'kbase-test',
            label: 'KBase Test/Beta User'
          }, {
            id: 'commercial',
            label: 'Commercial User'
          }],
          userTitles: [{
            id: 'mr',
            label: 'Mr.'
          }, {
            id: 'ms',
            label: 'Ms.'
          }, {
            id: 'dr',
            label: 'Dr.'
          }, {
            id: 'prof',
            label: 'Prof.'
          }],
          gravatarDefaults: [{
            id: 'mm',
            label: 'Mystery Man - simple, cartoon-style silhouetted outline'
          }, {
            id: 'identicon',
            label: 'Identicon - a geometric pattern based on an email hash'
          }, {
            id: 'monsterid',
            label: 'MonsterID - generated "monster" with different colors, faces, etc'
          }, {
            id: 'wavatar',
            label: 'Wavatar - generated faces with differing features and backgrounds'
          }, {
            id: 'retro',
            label: 'Retro - 8-bit arcade-style pixelated faces'
          }, {
            id: 'blank',
            label: 'Blank - A Blank Space'
          }],
          avatarColors: [{
            id: 'maroon',
            label: 'maroon',
            color: '#800000',
            textColor: '#FFF'
          }, {
            id: 'red',
            label: 'red',
            color: '#ff0000',
            textColor: '#FFF'
          }, {
            id: 'orange',
            label: 'orange',
            color: '#ffA500',
            textColor: '#FFF'
          }, {
            id: 'yellow',
            label: 'yellow',
            color: '#ffff00',
            textColor: '#000'
          }, {
            id: 'olive',
            label: 'olive',
            color: '#808000',
            textColor: '#FFF'
          }, {
            id: 'purple',
            label: 'purple',
            color: '#800080',
            textColor: '#FFF'
          }, {
            id: 'fuchsia',
            label: 'fuchsia',
            color: '#ff00ff',
            textColor: '#FFF'
          }, {
            id: 'white',
            label: 'white',
            color: '#ffffff',
            textColor: '#000'
          }, {
            id: 'lime',
            label: 'lime',
            color: '#00ff00',
            textColor: '#000'
          }, {
            id: 'green',
            label: 'green',
            color: '#008000',
            textColor: '#FFF'
          }, {
            id: 'navy',
            label: 'navy',
            color: '#000080',
            textColor: '#FFF'
          }, {
            id: 'blue',
            label: 'blue',
            color: '#0000ff',
            textColor: '#FFF'
          }, {
            id: 'aqua',
            label: 'aqua',
            color: '#00ffff',
            textColor: '#000'
          }, {
            id: 'teal',
            label: 'teal',
            color: '#008080',
            textColor: '#FFF'
          }, {
            id: 'black',
            label: 'black',
            color: '#000000',
            textColor: '#FFF'
          }, {
            id: 'silver',
            label: 'silver',
            color: '#c0c0c0',
            textColor: '#000'
          }, {
            id: 'gray',
            label: 'gray',
            color: '#808080',
            textColor: '#FFF'
          }]


        }
      }

    });

    return SocialWidget;
  });
