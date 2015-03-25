define(['kb.props'], function (Props) {
    var Base = Object.create({}, {
        config: {
            value: Object.create(Props).init(),
            writable: false
        }
    });

    "use strict";
    /**
     A simple logger for the KBase javscript front end.
     At the moment, simply a stubby sort of library, accepting 
     log entries and emitting them to the console in a structured way.
     Log entries are objects:
     type:
     source:
     shortMessage:
     message:
     data:
     */
    var Logger = Object.create(Base, {
        init: {
            value: function (cfg) {
                this.source = cfg.source;
            }
        },
        log: {
            value: function (msg) {
                var ts = (new Date()).toISOString();

                var label;
                var type = msg.type.toUpperCase();
                var label = null;
                var outputter = null;
                switch (type) {
                    case 'ERROR':
                        outputter = 'error';
                        break;
                    case 'WARNING':
                        outputter = 'warn';
                        break;
                    case 'INFO':
                        outputter = 'info';
                        break;
                    case 'DEBUG':
                        outputter = 'debug';
                        break;
                    default:
                        label = type;
                        outputter = console.log;
                        console.log('WARNING: invalid log type: ' + msg.type);
                }

                var source = msg.source || this.source || '';
                if (label) {
                    var prefix = label + ': ' + ts + ': ' + ': ' + source + ': ';
                } else {
                    var prefix = ts + ': ' + ': ' + source + ': ';
                }
                if (msg.title) {
                    console[outputter](prefix + msg.title);
                }
                if (msg.message) {
                    console[outputter](prefix + msg.message);
                }
                if (msg.data) {
                    console[outputter](prefix + 'Data follows');
                    console[outputter](msg.data);
                }
                return this;
            }
        },
        dontLog: {
            value: function (type) {
                this.config.setProp(['excludeType', type], true);
            }
        },
        doLog: {
            value: function (type) {
                this.config.deleteProp(['excludeType', type]);
            }
        },
        isLogging: {
            value: function (type) {
                return !this.config.getProp(['excludeType', type], false);
            }
        },
        logError: {
            value: function (msg) {
                if (this.isLogging('error')) {
                    msg.type = 'ERROR';
                    this.log(msg);
                }
                return this;
            }
        },
        logWarning: {
            value: function (msg) {
                if (this.isLogging('warning')) {
                    msg.type = 'WARNING';
                    this.log(msg);
                }
                return this;
            }
        },
        logInfo: {
            value: function (msg) {
                if (this.isLogging('info')) {
                    msg.type = 'INFO';
                    this.log(msg);
                }
                return this;
            }
        },
        logDeprecation: {
            value: function (msg) {
                if (this.isLogging('deprecation')) {
                    msg.type = 'DEPRECATION';
                    this.log(msg);
                }
                return this;
            }
        },
        logDebug: {
            value: function (msg) {
                if (this.isLogging('debug')) {
                    msg.type = 'DEBUG';
                    this.log(msg);
                }
                return this;
            }
        }
    });

    // The logger can be used as-is, or as the basis for a custom logger.
    return Logger;
});