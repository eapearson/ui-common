/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(['q', 'postal', 'kb.utils', 'kb.runtime'], function (Q, Postal, Utils, Runtime) {
    'use strict';
    var Notification = Object.create({}, {
        setProp: {
            value: function (key, value) {
                if (this[key] === undefined) {
                    Object.defineProperty(this, key, {
                        value: value
                    });
                } else {
                    this[key] = value;
                }
            }
        },
        id: {
            get: function () {
                return this._id;
            },
            set: function (id) {
                var t = typeof id;
                switch (t) {
                case 'string':
                    break;
                case 'number':
                    id = '' + id;
                    break;
                default:
                    throw new Error('Invalid type for Notification id: ' + t);
                }
                this.setProp('_id', id);
            },
            enumerable: true
        },
        addedAt: {
            get: function () {
                return this._addedAt;
            },
            set: function (value) {
                var v;
                var t = typeof value;
                switch (t) {
                case 'string':
                    v = Utils.iso8601ToDate(value);
                    break;
                default:
                    throw new Error('Invalid type for Notification addedAt field: ' + t);
                }
                this.setProp('_addedAt', v);
            },
            enumerable: true
        },
        addedBy: {
            get: function () {
                return this._addedBy;
            },
            set: function (value) {
                var t = typeof value;
                if (t !== 'string') {
                    throw new Error('Invalid type for Notification addedAt field: ' + t);
                }
                this.setProp('_addedBy', value);
            },
            enumerable: true
        },
        updatedAt: {
            get: function () {
                return this._updatedAt;
            },
            set: function (value) {
                var v;
                var t = typeof value;
                switch (t) {
                case 'string':
                    v = Utils.iso8601ToDate(value);
                    break;
                default:
                    throw new Error('Invalid type for Notification updatedAt field: ' + t);
                }
                this.setProp('_updatedAt', v);
            },
            enumerable: true
        },
        updatedBy: {
            get: function () {
                return this._updatedBy;
            },
            set: function (value) {
                var t = typeof value;
                if (t !== 'string') {
                    throw new Error('Invalid type for Notification updatedBy field: ' + t);
                }
                this.setProp('_updatedBy', value);
            },
            enumerable: true
        },
        title: {
            get: function () {
                return this._title;
            },
            set: function (value) {
                var t = typeof value;
                if (t !== 'string') {
                    throw new Error('Invalid type for Notification title field: ' + t);
                }
                this.setProp('_title', value);
            },
            enumerable: true
        },
        notification: {
            get: function () {
                return this._notification;
            },
            set: function (value) {
                var t = typeof value;
                if (t !== 'string') {
                    throw new Error('Invalid type for Notification "notification" field: ' + t);
                }
                this.setProp('_notification', value);
            },
            enumerable: true
        },
        description: {
            get: function () {
                return this._description;
            },
            set: function (value) {
                var t = typeof value;
                if (t !== 'string') {
                    throw new Error('Invalid type for Notification "description" field: ' + t);
                }
                this.setProp('_description', value);
            },
            enumerable: true
        },
        url: {
            get: function () {
                return this._url;
            },
            set: function (value) {
                var t = typeof value;
                if (t !== 'string') {
                    throw new Error('Invalid type for Notification "url" field: ' + t);
                }
                this.setProp('_url', value);
            },
            enumerable: true
        },
        type: {
            get: function () {
                return this._type;
            },
            set: function (value) {
                var t = typeof value;
                if (t !== 'string') {
                    throw new Error('Invalid type for Notification "type" field: ' + t);
                }
                this.setProp('_type', value);
            },
            enumerable: true
        },
        status: {
            get: function () {
                return this._status;
            },
            set: function (value) {
                var t = typeof value;
                if (t !== 'string') {
                    throw new Error('Invalid type for Notification "status" field: ' + t);
                }
                this.setProp('_status', value);
            },
            enumerable: true
        },
        startAt: {
            get: function () {
                return this._startAt;
            },
            set: function (value) {
                var v;
                var t = typeof value;
                switch (t) {
                case 'string':
                    v = Utils.iso8601ToDate(value);
                    break;
                default:
                    throw new Error('Invalid type for Notification "startAt" field: ' + t);
                }
                this.setProp('_startAt', v);
            },
            enumerable: true
        },
        endAt: {
            get: function () {
                return this._endAt;
            },
            set: function (value) {
                if (value === undefined) {
                    // fine, leave undefined.
                } else {
                    var t = typeof value;
                    var newValue;
                    switch (t) {
                    case 'string':
                        newValue = Utils.iso8601ToDate(value);
                        break;
                    case 'undefined':
                    case 'null':
                        newValue = value;
                        break;
                    case 'object':
                        if (value === null) {
                            newValue = null;
                            break;
                        } 
                    default:
                        throw new Error('Invalid type "' + t + '" for Notification "endAt" field with value ' + value);
                    }
                    this.setProp('_endAt', newValue);
                }
            },
            enumerable: true
        },
        init: {
            value: function (cfg) {
                this.id = cfg.id;
                this.addedAt = cfg.addedAt;
                this.addedBy = cfg.addedBy;
                this.updatedAt = cfg.updatedAt;
                this.updatedBy = cfg.updatedBy;
                this.title = cfg.title;
                this.notification = cfg.notification;
                this.description = cfg.description;
                this.url = cfg.url;
                this.type = cfg.type;
                this.status = cfg.status;
                this.startAt = cfg.startAt;
                this.endAt = cfg.endAt;

                return this;
            }
        },
        getJSON: {
            value: function () {
                // var props = Object.keys(this);
                var o = {};
                var p;
                for (p in this) {
                    // props.forEach(function (p) {
                    o[p] = this[p];
                }
                return o;
            }
        }
    });

    var Notifications = Object.create({}, {
        Notifications_init: {
            value: function (cfg) {
                this.notifications = {};
                
                if (!Runtime.config.hasConfig('systemnotifications_url')) {
                    throw new Error('Notifications requires a data source url; none provided in the the site configuration');
                }
                this.dataSourceURL = Runtime.config.getConfig('systemnotifications_url');

                if (!cfg.name) {
                    throw new Error('Notifications requires a human-legible "name"');
                }
                this.name = cfg.name;

                if (!cfg.id) {
                    throw new Error('Notifications requires an "id"; e.g. to be used for the fetching from the service ');                          }
                this.id = cfg.id;

                return this;
            }
        },
        clearNotifications: {
            value: function () {
                this.notifications = {};
                Postal.channel('notifications').publish('updated', {
                    notifications: this
                });
                return this;
            }
        },
        setNotification: {
            value: function (notification) {
                this.notifications[notification.id] = {
                    notification: Object.create(Notification).init(notification),
                    timeAdded: (new Date())
                };
                Postal.channel('notifications').publish('updated', {
                    notifications: this
                });
                return this;
            }
        },
        addNotification: {
            value: function (notification) {
                if (this.notifications[notification.id]) {
                    throw new Error('This notification already exists');
                }
                this.setNotification(notification);
                return this;
            }
        },
        updateNotification: {
            value: function (notification) {
                this.setNotification(notification);
                return this;
            }
        },
        getNotifications: {
            value: function () {
                return this.notifications;
            }
        },
        getNotification: {
            value: function (id) {
                return this.notifications[id];
            }
        },
        getJSON: {
            value: function () {
                var ks = Object.keys(this.notifications);
                var o = [];
                ks.forEach(function (k) {
                    o.push(this.notifications[k].notification.getJSON());
                }.bind(this));
                return o;
            }
        },
        fetch: {
            value: function () {
                return Q.Promise(function (resolve, reject) {
                    var url = this.dataSourceURL + '/' + this.id;
                    // var notificationURL = 'https://staging.kbase.us/wp-json/kbase/notifications/currentissues';
                    Utils.getJSON(url)
                        .then(function (data) {
                            // Postal.channel('notifications').publish(this.queryId, this);
                            //console.log('got it!' + (typeof data));
                            //console.log(data);
                            // resolve(data);
                            if (data) {
                                data.forEach(function (n) {
                                    this.addNotification(n);
                                }.bind(this));
                            }
                            resolve(this);
                        }.bind(this))
                        .catch(function (err) {
                            console.log('ERROR'); console.log(err);
                        })
                        .done();
                }.bind(this));
            }
        }
    });

    var CurrentIssues = Object.create(Notifications, {
        init: {
            value: function (cfg) {
                this.Notifications_init(cfg);
                return this;
            }
        }
    }).init({
        name: 'Current Issues',
        id: 'currentissues'
    });

    var Maintenance = Object.create(Notifications, {
        init: {
            value: function (cfg) {
                this.Notifications_init(cfg);
                return this;
            }
        }
    }).init({
        name: 'Upcoming Maintenance',
        id: 'maintenance'
    });

    var RecentUpdates = Object.create(Notifications, {
        init: {
            value: function (cfg) {
                this.Notifications_init(cfg);
                return this;
            }
        }
    }).init({
        name: 'Recent Updates',
        id: 'recentupdates'
    });
    
    var AllNotifications = Object.create(Notifications, {
        init: {
            value: function (cfg) {
                this.Notifications_init(cfg);
                return this;
            }
        }
    }).init({
        name: 'All Notifications',
        id: 'relevant'
    });

    return {
        Notification: Notification,
        Notifications: Notifications,
        // systemNotifications: Notifications.init(),
        CurrentIssues: CurrentIssues,
        Maintenance: Maintenance,
        RecentUpdates: RecentUpdates,
        AllNotifications: AllNotifications
    };
});