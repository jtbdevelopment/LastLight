/* globals AbstractWaveEnemy: false */
'use strict';

var SimpleKamikaze = function (game, x, y, key, frame) {
    AbstractWaveEnemy.call(this, game, x, y, key, frame);
    this.name = 'SimpleKamikaze';
    this.state = undefined;
};

SimpleKamikaze.prototype = Object.create(AbstractWaveEnemy.prototype);
SimpleKamikaze.prototype.constructor = SimpleKamikaze;

SimpleKamikaze.prototype.updateFunction = function (playerCenter) {
    AbstractWaveEnemy.prototype.updateFunction.call(this, playerCenter);
    if (this.body.collideWorldBounds) {
        this.state.calculator.turnToPlayerCenter(playerCenter, this, this.state.levelData.enemyTurnRate);
    }
};


