define(['kb.systemnotifications', 'kb.widget.base', 'kb.utils', 'kb.appstate'], function (Notifications, BaseWidget, Utils, AppState) {
    var W = Object.create(BaseWidget, {
        init: {
            value: function (cfg) {
                cfg.collection = 'systemnotifications';
                cfg.name = 'SystemNotificationsBadge';
                cfg.title = 'System Notifications Badge';
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
        /*
         afterStart: {
            value: function () {
                AppState.listenForItem('notifications', {
                    owner: this,
                    onSet: function (notifications) {
                        this.updateState(notifications);
                    },
                    onError: function (err) {
                        this.owner.setError(err);
                    }
                });            
            }
        },
        */
        updateState: {
            value: function (notifications) {
                // now we transform into something for our template...

                // Get any in-progress outages
                var now = new Date();
                var currentMaintenance = notifications.filter(function (n) {
                    if ( (n.startAt.getTime() <= now.getTime()) &&
                        (!n.endAt || (n.endAt.getTime() >= now.getTime())) && 
                        n.type === 'system-maintenance') {
                        return true;
                    } else {
                        return false;
                    }
                });

                var currentIssues = notifications.filter(function (n) {
                    if ( (n.startAt.getTime() <= now.getTime()) &&
                         (!n.endAt || (n.endAt.getTime() >= now.getTime())) && 
                         n.type === 'system-issue') {
                        return true;
                    } else {
                        return false;
                    }
                });


                // Get any upcoming outages.
                var futureMaintenance = notifications.filter(function (n) {
                   if ( (n.startAt.getTime() > now.getTime()) &&
                        n.type === 'system-maintenance'  ) {
                        return true;
                    } else {
                        return false;
                    }
                });

                // Get up to 3 past updates
                var recentUpdates = notifications.filter(function (n) {
                   if ( (n.startAt.getTime() < now.getTime()) &&
                        n.type === 'system-update' ) {
                        return true;
                    } else {
                        return false;
                    }
                });

                this.setState('issues.current', currentIssues);
                this.setState('maintenance.current', currentMaintenance);
                this.setState('maintenance.future', futureMaintenance);
                this.setState('updates.recent', recentUpdates);
            }
        },
        setInitialState: {
            value: function (options) {
                // The base method just resolves immediately (well, on the next turn.) 
                return Q.Promise(function (resolve) {
                   AppState.listenForItem('notifications', {
                        widget: this,
                        runCount: 0,
                        onSet: function (notifications) {
                            this.widget.updateState(notifications.getJSON());
                            if (this.runCount === 0) {
                                resolve();
                            }
                            this.runCount += 1;
                        }
                    });
                }.bind(this));
            }
        }
    });
    return W;
});

