/* globals Phaser: false */
'use strict';

var Act4Enemy = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.name = 'Act4Enemy';
};

Act4Enemy.prototype = Object.create(Phaser.Sprite.prototype);
Act4Enemy.prototype.constructor = Act4Enemy;

Act4Enemy.prototype.activateFunction = function (health, damage, size) {
    this.health = health;
    this.damage = damage;
    this.body.height = size;
    this.body.width = size;
    this.height = size;
    this.width = size;
};

Act4Enemy.prototype.updateFunction = function () {
};

