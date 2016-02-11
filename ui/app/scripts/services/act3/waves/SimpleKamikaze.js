/* globals AbstractEnemy: false */
'use strict';

var SimpleKamikaze = function (game, x, y, key, frame) {
    AbstractEnemy.call(this, game, x, y, key, frame);
    this.name = 'SimpleKamikaze';
    this.state = undefined;
};

SimpleKamikaze.prototype = Object.create(AbstractEnemy.prototype);
SimpleKamikaze.prototype.constructor = SimpleKamikaze;

SimpleKamikaze.prototype.updateFunction = function (playerCenter) {
    AbstractEnemy.prototype.updateFunction.call(this, playerCenter);
    if (this.body.collideWorldBounds) {
        this.state.calculator.turnToPlayerCenter(playerCenter, this, this.state.levelData.enemyTurnRate);
    }
};


