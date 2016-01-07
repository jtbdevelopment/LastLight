'use strict';

/**
 * @ngdoc overview
 * @name uiApp
 * @description
 * # uiApp
 *
 * Main module of the application.
 */
angular
    .module('uiApp', [
        'ngAnimate',
        'ngCookies',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch'
    ])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/title', {
                templateUrl: 'views/main.html',
                controller: 'TitleCtrl'
            })
            .when('/act1', {
                templateUrl: 'views/main.html',
                controller: 'Act1Ctrl'
            })
            .when('/act1temp', {
                templateUrl: 'views/main.html',
                controller: 'Act1TempCtrl'
            })
            .when('/act3', {
                templateUrl: 'views/main.html',
                controller: 'Act3Ctrl'
            })
            .otherwise({
                redirectTo: '/title'
            });
    });
