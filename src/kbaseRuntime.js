define(['kb.config',  'json!functional-site/config.json'], 
function (Config,  currentConfig) {
    'use strict';
    
    /* 
     * A gathering place for runtime support.
     * 
     */
    
    var appConfig = Object.create(Config.Config).init({
        config: currentConfig[currentConfig.setup]
    });
    
    // Load system notifications and set up a heartbeat listener.
    
    // Set up notifications
    
    
    return {
        config: appConfig
    }
    
});