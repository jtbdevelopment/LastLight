
SimpleFiringBoss = function(game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.$timeout = undefined;
};

SimpleFiringBoss.prototype = Object.create(Phaser.Sprite.prototype);
SimpleFiringBoss.prototype.constructor = SimpleFiringBoss;

SimpleFiringBoss.prototype.bossLoaded = function() {
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
    this.bosy.velocity.y = -40;
};

SimpleFiringBoss.prototype.updateFunction = function() {
};
