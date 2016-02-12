/* globals Phaser: false */
'use strict';

var AbstractWaveEnemy = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.name = 'AbstractEnemy';
};

AbstractWaveEnemy.prototype = Object.create(Phaser.Sprite.prototype);
AbstractWaveEnemy.prototype.constructor = AbstractWaveEnemy;

AbstractWaveEnemy.prototype.updateFunction = function () {
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

