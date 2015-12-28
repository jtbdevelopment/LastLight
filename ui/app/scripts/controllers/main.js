'use strict';

/**
 * @ngdoc function
 * @name uiApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the uiApp
 */
angular.module('uiApp')
    .controller('MainCtrl', ['GameFactory', function (GameFactory) {
        GameFactory.state.start('TitleScreen', true, false, 0, 0);
    }]);

