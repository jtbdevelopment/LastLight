/* globals Phaser: false */
'use strict';

var AbstractAct1Enemy = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.name = 'AbstractEnemy';
};

AbstractAct1Enemy.prototype = Object.create(Phaser.Sprite.prototype);
AbstractAct1Enemy.prototype.constructor = AbstractAct1Enemy;


