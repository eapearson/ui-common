/*global define: true */
/*jslint browser:true  vars: true */
define(['jquery', 'kb.session', 'kb.runtime', 'kb.widget.base', 'kb.widget.login', 'kb.widget.systemnotifications.badge'],
    function ($, Session, Runtime, BaseWidget, LoginWidget, NotificationBadge) {
        "use strict";
        var Navbar = Object.create(BaseWidget, {
            /**
             * The semantic version of this module.
             * 
             */
            version: {
                value: '0.0.3',
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
                value: function (cfg) {
                    // Looks like a widget ... acts like a widget ...
                    cfg.title = 'Navbar Widget';
                    cfg.name = 'Navbar';
                    this.BaseWidget_init(cfg);

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
            /**
             * Clear all elements of the NavBar, including the menu,
             * title, and buttons.
             * 
             * @function clear
             * @returns {this}
             */
            clear: {
                value: function () {
                    this.clearMenu();
                    this.clearTitle();
                    this.clearButtons();
                    return this;
                }
            },
            /**
             * Clear the title area of the navbar. The change is guaranteed to
             * occur in the next refresh.
             * 
             * @function clearTitle
             * @returns {this}
             */
            clearTitle: {
                value: function () {
                    this.setState('title', '');
                    return this;
                }
            },
            /**
             * Clears all buttons from the navbar.
             * 
             * @function
             */
            clearButtons: {
                value: function () {
                    this.setState('buttons', []);
                    return this;
                }
            },
            addButton: {
                value: function (cfg) {
                    var buttons = this.getState('buttons');
                    buttons.push(cfg);
                    this.setState('buttons', buttons);
                    return this;
                }
            },
            renderButton: {
                value: function (cfg) {
                    
                    //if (cfg.color) {
                    //   iconStyle += 'color: ' + cfg.color + ';';
                    //}

                    var iconStyle = '';
                    var label = '';
                    if (cfg.label) {
                        label = '<div class="kb-nav-btn-txt">' + cfg.label + '</div>';
                    } else {
                        iconStyle += 'font-size: 150%;';
                    }
                    
                    var button;
                    if (cfg.url) {
                        // a link style button
                        if (cfg.external) {
                            cfg.target = '_blank';
                        }
                        var target;
                        if (cfg.target) {
                            target = 'target="' + cfg.target + '"';
                        } else {
                            target = '';
                        }
                        button = $('<a data-button="' + cfg.name + '" id="kb-' + cfg.name + '-btn" class="btn btn-' + (cfg.style || 'default') + ' navbar-btn kb-nav-btn" role="button" href="' + cfg.url + '" ' + target + '>' +
                                '  <div class="fa fa-' + cfg.icon + '" style="' + iconStyle + '"></div>' + label + '</a>');

                    } else {
                        button = $('<button data-button="' + cfg.name + '" id="kb-' + cfg.name + '-btn" class="btn btn-' + (cfg.style || 'default') + ' navbar-btn kb-nav-btn">' +
                                '  <div class="fa fa-' + cfg.icon + '" style="' + iconStyle + '"></div>' + label + '</button>')
                                .on('click', function (e) {
                                    e.preventDefault();
                                    cfg.callback();
                                });
                    }
                    if (cfg.disabled) {
                        button.prop('disabled', true);
                    }
                    if (cfg.place === 'end') {
                        this.findPlaceholder('navbar-buttons').append(button);
                    } else {
                        this.findPlaceholder('navbar-buttons').prepend(button);
                    }
                    return this;
                }
            },
            renderButtons: {
                value: function () {
                    this.findPlaceholder('navbar-buttons').empty();
                    var i;
                    var buttons = this.getState('buttons');
                    for (i = 0; i < buttons.length; i += 1) {
                        switch (buttons[i].type) {
                        case 'dropdown': 
                            this.renderDropdown(buttons[i]); 
                            break;
                        default: 
                            this.renderButton(buttons[i]);
                        }
                    }
                }
            },
            findButton: {
                value: function (name) {
                    return this.findPlaceholder('navbar-buttons').find('[data-button="' + name + '"]');
                }
            },
            addDropdown: {
                value: function (cfg) {
                    cfg.type = 'dropdown';
                    var buttons = this.getState('buttons');
                    buttons.push(cfg);
                    this.setState('buttons', buttons);
                    return this;
                }
            },
            renderDropdown: {
                value: function (cfg) {
                    // var button = $('<button type="button" class="btn btn-' + cfg.style + ' dropdown-toggle" data-toggle="dropdown" aria-expanded="false">' + cfg.label + ' <span class="caret"></span></button>');
                    var iconStyle = '';
                    var label = '';
                    if (cfg.label) {
                        label = '<div class="kb-nav-btn-txt">' + cfg.label + ' <span class="caret"></span></div>';
                    } else {
                        label = cfg.label + ' <span class="caret"></span>';
                        iconStyle += 'font-size: 150%;';
                    }
                    var button = $('<button  class="btn btn-' + (cfg.style || 'default') + ' navbar-btn kb-nav-btn dropdown-toggle" data-toggle="dropdown" aria-expanded="false">' +
                            '  <div class="fa fa-' + cfg.icon + '" style="' + iconStyle + '"></div>' + label + '</button>');
                    if (cfg.disabled) {
                        button.prop('disabled', true);
                    }

                    var menu = $('<ul class="dropdown-menu" role="menu"></ul>');
                    if (cfg.items) {
                        for (var i = 0; i < cfg.items.length; i++) {
                            var item = cfg.items[i];
                            if (item.type === 'divider') {
                                menu.append('<li class="divider"></li>');
                            } else {
                                var menuItem = $('<li></li>');

                                if (item.url) {
                                    var link = $('<a></a>')
                                            .attr('href', item.url)
                                            .attr('data-menu-item', item.name);
                                } else if (item.callback) {
                                    var link = $('<a></a>')
                                            .attr('href', '#')
                                            .attr('data-menu-item', item.name)
                                            .on('click', item.callback);
                                }
                                if (item.external) {
                                    link.attr('target', '_blank');
                                }

                                var icon = $('<div class="navbar-icon" style=""></div>');
                                if (item.icon) {
                                    icon.append($('<span class="fa fa-' + item.icon + '"  class="navbar-icon"></span>'));
                                }

                                menu.append(menuItem.append(link.append(icon).append(item.label)));
                            }
                        }
                    }
                    var dropdown = $('<div class="dropdown" style="display: inline-block;"></div>').append(button).append(menu);
                    if (cfg.place === 'end') {
                        this.findPlaceholder('navbar-buttons').append(dropdown);
                    } else {
                        this.findPlaceholder('navbar-buttons').prepend(dropdown);
                    }
                    /*if (cfg.widget) {
                        var widgetName = cfg.widget;
                        var panel = $('<div>');
                        menu.append($('<li></li>').append(panel));
                        var widget = panel[widgetName]({dropdown: dropdown, navbar: this, params: cfg.params});
                    }
                    */
                    
                    return this;
                }
            },
            /* TODO: This should not be here, rather in some top level module, like the app */
            addDefaultMenu: {
                value: function (cfg) {
                    cfg = cfg || {};
                    var hasRegularMenuItems = false;
                    if (cfg.search !== false) {
                        this.addMenuItem({
                            name: 'search',
                            icon: 'search',
                            label: 'Search Data',
                            url: '#/search/?q=*',
                            place: 'end'
                        });
                        hasRegularMenuItems = true;
                    }
                    if (cfg.narrative !== false) {
                        this.addMenuItem({
                            name: 'narrative',
                            label: 'Narrative',
                            icon: 'file',
                            url: '#/narrativemanager/start',
                            external: true,
                            place: 'end'
                        });
                        hasRegularMenuItems = true;
                    }
                    if (cfg.dashboard !== false) {
                        this.addMenuItem({
                            name: 'dashboard',
                            label: 'Dashboard',
                            icon: 'dashboard',
                            url: '#/dashboard',
                            place: 'end'
                        });
                        hasRegularMenuItems = true;

                    }
                    if (hasRegularMenuItems) {
                        this.addMenuItem({
                            type: 'divider',
                            name: 'help',
                            place: 'end'
                        });
                    }
                    this.addHelpMenuItem({
                        name: 'contactus',
                        label: 'Contact Us',
                        icon: 'envelope-o',
                        url: Runtime.config.getConfig('docsite.baseUrl') + Runtime.config.getConfig('docsite.paths.contact'),
                        place: 'end'
                    });
                    this.addHelpMenuItem({
                        name: 'about',
                        label: 'About KBase',
                        icon: 'info-circle',
                        url: Runtime.config.getConfig('docsite.baseUrl') + Runtime.config.getConfig('docsite.paths.about'),
                    });
                    return this;
                }
            },
            makeMenuItem: {
                value: function (cfg) {
                    var item;
                    if (cfg.type === 'divider') {
                        item = $('<li  role="presentation" class="divider"></li>').attr('data-menu-item', cfg.name);
                    } else {
                        item = $('<li></li>');
                        if (cfg.url) {
                            var link = $('<a></a>')
                                    .attr('href', cfg.url)
                                    .attr('data-menu-item', cfg.name);
                        } else if (cfg.callback) {
                            var link = $('<a></a>')
                                    .attr('href', '#')
                                    .attr('data-menu-item', cfg.name)
                                    .on('click', cfg.callback);
                        }
                        if (cfg.external) {
                            link.attr('target', '_blank');
                        }
                        var icon = $('<div class="navbar-icon" style=""></div>');
                        if (cfg.icon) {
                            icon.append($('<span class="fa fa-' + cfg.icon + '"  class="navbar-icon"></span>'));
                        }
                        item.append(link.append(icon).append(cfg.label));
                    }
                    return item;
                }
            },
            addMenuItem: {
                value: function (item) {
                    var menu = this.getState('menu');
                    // var item = this.makeMenuItem(cfg);
                    if (item.place === 'end') {
                        menu.push(item);
                    } else {
                        menu.unshift(item);
                    }
                    this.setState('menu', menu);
                    return this;
                }
            },
            removeMenuItem: {
                value: function (cfg) {

                }
            },
            setAboutURL: {
                value: function (cfg) {

                }
            },
            addHelpMenuItem: {
                value: function (item) {
                    var menu = this.getState('helpmenu');
                    // var item = this.makeMenuItem(cfg);
                    if (item.place === 'end') {
                        menu.push(item);
                    } else {
                        menu.unshift(item);
                    }
                    this.setState('helpmenu', menu);
                    return this;
                }
            },
            removeHelpMenuItem: {
                value: function (cfg) {

                }
            },
            clearMenu: {
                value: function (cfg) {
                    this.setState('menu', []);
                    this.setState('helpmenu', []);
                    return this;
                }
            },
            setInitialState: {
                value: function (options) {
                    // The base method just resolves immediately (well, on the next turn.) 
                    return Q.Promise(function (resolve) {
                        this.setState('menu', []);
                        this.setState('helpmenu', []);
                        this.setState('title', '');
                        this.setState('notifications', []);
                        this.setState('login', []);
                        this.setState('buttons', []);
                        // this.addDefaultMenu();
                        resolve();
                    }.bind(this));
                }
            },
            // OUR RENDER
            renderMenu: {
                value: function () {
                    var menu = this.getState('menu');
                    var i;
                    var menuNode = this.container.find('.dropdown-menu');
                    menuNode.empty();
                    if (menu) {
                        for (i = 0; i < menu.length; i += 1) {
                            var item = this.makeMenuItem(menu[i]);
                            menuNode.append(item);
                        }
                    }
                    menu = this.getState('helpmenu');
                    if (menu) {
                        for (i = 0; i < menu.length; i += 1) {
                            var item = this.makeMenuItem(menu[i]);
                            menuNode.append(item);
                        }
                    }
                }
            },
            setTitle: {
                value: function (newTitle) {
                    this.setState('title', newTitle);
                    return this;
                }
            },
            renderTitle: {
                value: function () {
                    this.places.content.find('[data-placeholder="navbar-title"]').html(this.getState('title'));
                }
            },
            renderNotifications: {
                value: function () {
                    // this.places.content.find('[data-placeholder="navbar-notifications"]').html('notifications here...');
                    var notificationBadge = Object.create(NotificationBadge)
                            .init({container: this.places.content.find('[data-placeholder="navbar-notifications"]')})
                            .go();
                }
            },
            renderLogin: {
                value: function () {
                    // this.places.content.find('[data-placeholder="navbar-login"]').html('login here...');
                    var loginWidget = Object.create(LoginWidget)
                        .init({container: this.places.content.find('[data-placeholder="navbar-login"]')})
                        .go();
                }
            },
            render: {
                value: function () {
                    // Generate initial view based on the current state of this widget.
                    // Head off at the pass -- if not logged in, can't show profile.
                    if (this.error) {
                        this.renderError();
                    } else if (Session.isLoggedIn()) {
                        this.places.content.html(this.renderTemplate('authorized'));
                        // is this damn thing ready?
                        
                        // render menu
                        this.renderMenu();
                        
                        // render title
                        this.renderTitle();
                        
                        // render notifications
                        this.renderNotifications();
                        
                        // render login
                        this.renderLogin();
                        
                        // render buttons
                        this.renderButtons();
                        
                        
                    } else {
                        
                        this.places.content.html(this.renderTemplate('unauthorized'));
                        // render menu
                        this.renderMenu();
                        
                        // render title
                        this.renderTitle();
                        
                        // render notifications
                        this.renderNotifications();
                        
                        // render login
                        this.renderLogin();
                        
                        
                    }
                    return this;
                }
            }
        });
        //var TheNavbar = Object.create(Navbar).init({
        //   container: '#kbase-navbar'
        //});

        //  return TheNavbar;
        return Navbar;
    });
