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

AbstractEnemy.prototype.updateFunction = function () {
    if (!this.body.collideWorldBounds) {
        if (this.x >= 0 &&
            this.x <= (this.game.width - this.width) &&
            this.y >= 0 &&
            this.y <= (this.game.height - this.height)
        ) {
            this.body.collideWorldBounds = true;
        }
    }
};

