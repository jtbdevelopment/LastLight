/* globals Phaser: false */
'use strict';

var SimpleFiringBoss = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
};

SimpleFiringBoss.prototype = Object.create(Phaser.Sprite.prototype);
SimpleFiringBoss.prototype.constructor = SimpleFiringBoss;

SimpleFiringBoss.prototype.resetBoss = function (x, y, health) {
    Phaser.Component.Reset.prototype.reset.call(this, x, y, health);
    this.attacks = this.state.game.add.group();
    this.attacks.enableBody = true;
    this.attacks.physicsBodyType = Phaser.Physics.ARCADE;
    this.attacks.createMultiple(50, this.state.levelData.boss.attackImage);
    this.attacks.setAll('checkWorldBounds', true);
    this.attacks.setAll('body.debug', this.DEBUG);
    this.attacks.setAll('anchor.x', 0.5);
    this.attacks.setAll('anchor.y', 1.0);
    this.attacks.setAll('outOfBoundsKill', true);
    this.attacks.setAll('height', 5);
    this.attacks.setAll('width', 5);
    this.body.velocity.x = -5;
    this.body.velocity.y = -40;
    this.firePause = 5000;
    this.nextFireTime = 0;
    this.alive = true;
    this.attackSpeed = 500;
    this.hitsMultiple = this.state.levelData.boss.hitsMultiple;
};

SimpleFiringBoss.prototype.updateFunction = function (playerCenter) {
    if (this.state.game.time.now > this.nextFireTime && this.alive) {
        this.nextFireTime = this.state.game.time.now + this.firePause;

        var attack = this.attacks.getFirstExists(false);
        var x = this.x + this.width / 2;
        var y = this.y + this.height / 2;
        if (playerCenter.count > 0) {
            attack.reset(x, y);
            var distance = this.state.calculator.calcDistance(playerCenter, this);
            attack.body.velocity.x = this.attackSpeed * distance.distanceX / distance.distance;
            attack.body.velocity.y = this.attackSpeed * distance.distanceY / distance.distance;
        }
    }
    this.state.game.physics.arcade.overlap(this.state.players, this.attacks, this.attackHitsPlayer, null, this);
};

SimpleFiringBoss.prototype.attackHitsPlayer = function (player, attack) {
    this.state.enemyHitsPlayer(player);
    if (!this.hitsMultiple) {
        attack.kill();
    }
};
