/* globals Phaser: false */
'use strict';

var AbstractEnemy = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.$timeout = undefined;
    this.name = 'AbstractEnemy';
};

AbstractEnemy.prototype = Object.create(Phaser.Sprite.prototype);
AbstractEnemy.prototype.constructor = AbstractEnemy;

AbstractEnemy.prototype.activated = function(health) {
    this.health = health;
};

AbstractEnemy.prototype.update = function () {
};

