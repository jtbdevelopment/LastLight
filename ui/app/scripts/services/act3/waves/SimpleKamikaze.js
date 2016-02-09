/* globals AbstractEnemy: false */
'use strict';

var SimpleKamikaze = function (game, x, y, key, frame) {
    AbstractEnemy.call(this, game, x, y, key, frame);
    this.name = 'SimpleKamikaze';
};

SimpleKamikaze.prototype = Object.create(AbstractEnemy.prototype);
SimpleKamikaze.prototype.constructor = SimpleKamikaze;


