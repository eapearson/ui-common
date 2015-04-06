angular.module('login-directives', []);
angular.module('login-directives')
    .directive('loginform', function ($rootScope) {
        "use strict";
        return {
            link: function (scope, ele, attrs) {
                require(['kb.widget.login.loginform'], function (W) {
                    var widget = Object.create(W).init({
                        container: $(ele),
                        viewState: scope.viewState
                    }).start();
                    scope.$on('$destroy', function () {
                        if (widget && widget.stop) {
                            try {
                                widget.stop();
                            } finally {
                                // What do do here?
                            }
                        }
                    });
                });
            }
        };
    });