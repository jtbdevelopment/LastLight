/* globals AbstractAct1Enemy: false */
'use strict';

var PatrollingEnemy = function (game, x, y, key, frame) {
    AbstractAct1Enemy.call(this, game, x, y, key, frame);
    this.name = 'SimpleKamikaze';
    this.state = undefined;
};

PatrollingEnemy.prototype = Object.create(AbstractAct1Enemy.prototype);
PatrollingEnemy.prototype.constructor = PatrollingEnemy;

PatrollingEnemy.prototype.updateFunction = function (playerCenter) {
    AbstractAct1Enemy.prototype.updateFunction.call(this, playerCenter);
};


