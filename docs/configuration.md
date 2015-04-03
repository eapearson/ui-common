# Configuration

## Assets

- configuration file `/functional-site/config.json`
- module `/functional-site/src/kbaseConfig.js`


## Thoughts

### Config Module

- loads config via json plugin, so when the module is loaded, the config file is available
- automatically selects the config branch depending on the current config setting (set in the config file!)
- get config properties via standard property utility
- should only be used for reading, but setConfig is available for testing.

## TODO

### Reload

Support for reloading config? But that is complicated, because various pieces may need
to recalculate, refetch, re-render. Would need either a config pub/sub channel or actors...

## Implementation
