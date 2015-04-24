define(['kb.widget.base'], function (BaseWidget) {
    'use strict';
    var W = Object.create(BaseWidget, {
        init: {
            value: function (cfg) {
                cfg.name = 'News';
                cfg.collection = 'welcome';
                cfg.title = 'News Widget';
                this.BaseWidget_init(cfg);
                return this;
            }
        }
    });
    return W;
});