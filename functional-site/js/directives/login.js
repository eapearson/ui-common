angular.module('login-directives', []);
angular.module('login-directives')
    .directive('loginform', function ($rootScope, $stateParams) {
        "use strict";
        return {
            link: function (scope, ele, attrs) {
                require(['kb.widget.login.loginform'], function (W) {
                    var widget = Object.create(W).init({
                        container: $(ele),
                        viewState: scope.viewState
                    }, $stateParams).start();
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