define(['kb.systemnotifications', 'kb.widget.base', 'kb.utils'], function (Notifications, BaseWidget, Utils) {
    var W = Object.create(BaseWidget, {
        init: {
            value: function (cfg) {
                cfg.collection = 'systemnotifications';
                cfg.name = 'SystemNotificationsViewer';
                cfg.title = 'System Notifications';
                this.BaseWidget_init(cfg);
                
                this.templates.env.addFilter('niceElapsed', function (dateString) {
                    return Utils.niceElapsedTime(dateString);
                }.bind(this));
                this.templates.env.addFilter('niceTimestamp', function (dateString) {
                    return Utils.niceTimestamp(dateString);
                }.bind(this));
                this.templates.env.addFilter('isoDate', function (d) {
                    return Utils.iso8601ToDate(d);
                }.bind(this));
                this.templates.env.addFilter('niceTimerange', function (from, to) {
                    return Utils.niceTimerange(from, to);
                });
                    
                return this;
            }
        },
        setInitialState: {
            value: function (options) {
                // The base method just resolves immediately (well, on the next turn.) 
                return Q.Promise(function (resolve, reject, notify) {
                    // var n = Notifications.systemNotifications.getNotifications();
                    //var ns = [];
                    //var ks = Object.keys(n);
                    //var i;
                    //for (i in ks) {
                    //    ns.push(n[i].)
                    //}
                    // console.log(Notifications.systemNotifications);
                    
                    var notifications = Notifications.systemNotifications.getJSON();
                    
                    // now we transform into something for our template...
                    
                    // Get any in-progress outages
                    var now = new Date();
                    var currentOutages = notifications.filter(function (n) {
                        if ( (n.startAt.getTime() <= now.getTime()) &&
                            (!n.endAt || (n.endAt.getTime() >= now.getTime())) && 
                            (n.type === 'outage' || n.type === 'degradation') ) {
                            return true;
                        } else {
                            return false;
                        }
                    });
                                       
                    // Get any upcoming outages.
                    var futureOutages = notifications.filter(function (n) {
                       if ( (n.startAt.getTime() > now.getTime()) &&
                            (n.type === 'outage' || n.type === 'degradation') ) {
                            return true;
                        } else {
                            return false;
                        }
                    });
                    
                    // Get up to 3 past updates
                    var pastUpdates = notifications.filter(function (n) {
                       if ( (n.startAt.getTime() < now.getTime()) &&
                            n.type === 'update' ) {
                            return true;
                        } else {
                            return false;
                        }
                    });
                    
                    this.setState('currentOutages', currentOutages);
                    this.setState('futureOutages', futureOutages);
                    this.setState('pastUpdates', pastUpdates);
                    
                    resolve();
                }.bind(this));
            }
        }
    });
    return W;
});

