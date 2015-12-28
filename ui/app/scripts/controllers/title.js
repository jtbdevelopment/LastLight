'use strict';

/**
 * @ngdoc function
 * @name uiApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the uiApp
 */
angular.module('uiApp')
    .controller('TitleCtrl', ['$scope', 'GameFactory', function ($scope, GameFactory) {
        $scope.helpText = '';
        GameFactory.state.start('TitleScreen', true, false, 0, 0);
    }]);

