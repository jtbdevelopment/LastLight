/* globals Phaser: false */
/* globals SimpleFiringBoss: true */
'use strict';

var SimpleFiringBoss = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.$timeout = undefined;
};

SimpleFiringBoss.prototype = Object.create(Phaser.Sprite.prototype);
SimpleFiringBoss.prototype.constructor = SimpleFiringBoss;

SimpleFiringBoss.prototype.bossLoaded = function () {
    this.attacks = this.state.game.add.group();
    this.attacks.enableBody = true;
    this.attacks.physicsBodyType = Phaser.Physics.ARCADE;
    this.attacks.createMultiple(50, 'bossFire1');
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

    this.attacks = this.state.game.add.group();
    this.attacks.enableBody = true;
    this.attacks.physicsBodyType = Phaser.Physics.ARCADE;
    this.attacks.createMultiple(50, 'bossFire1');
    this.attacks.setAll('checkWorldBounds', true);
    this.attacks.setAll('body.debug', this.state.DEBUG);
    this.attacks.setAll('anchor.x', 0.5);
    this.attacks.setAll('anchor.y', 1.0);
    this.attacks.setAll('outOfBoundsKill', true);
    this.attacks.setAll('height', 5);
    this.attacks.setAll('width', 5);
};

SimpleFiringBoss.prototype.updateFunction = function () {
    if (this.state.game.time.now > this.nextFireTime && this.alive) {
        this.nextFireTime = this.state.game.time.now + this.firePause;

        var attack = this.attacks.getFirstExists(false);
        var x = this.x + this.width / 2;
        var y = this.y + this.height / 2;
        var playerCenter = this.state.calcPlayerGroupCenter();
        if (playerCenter.count > 0) {
            attack.reset(x, y);
            var distance = this.state.calcDistance(playerCenter, x, y);
            attack.body.velocity.x = this.attackSpeed * distance.distanceX / distance.distanceFactor;
            attack.body.velocity.y = this.attackSpeed * distance.distanceY / distance.distanceFactor;
        }
    }
    this.state.game.physics.arcade.overlap(this.state.players, this.attacks, this.attackHitsPlayer, null, this);
};

SimpleFiringBoss.prototype.attackHitsPlayer = function (player, attack) {
    this.state.enemyHitsPlayer(player);
    attack.kill();
};