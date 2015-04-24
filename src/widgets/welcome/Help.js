define(['kb.widget.base'], function (BaseWidget) {
    'use strict';
    var W = Object.create(BaseWidget, {
        init: {
            value: function (cfg) {
                cfg.name = 'Help';
                cfg.collection = 'welcome';
                cfg.title = 'Help Widget';
                this.BaseWidget_init(cfg);
                return this;
            }
        }
    });
    return W;
});