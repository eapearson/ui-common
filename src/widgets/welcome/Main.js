define(['kb.widget.base'], function (BaseWidget) {
    'use strict';
    var W = Object.create(BaseWidget, {
        init: {
            value: function (cfg) {
                cfg.name = 'Main';
                cfg.collection = 'welcome';
                cfg.title = 'Main Welcome Widget';
                this.BaseWidget_init(cfg);
                return this;
            }
        }
    });
    return W;
});