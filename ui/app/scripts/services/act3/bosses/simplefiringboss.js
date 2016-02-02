
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

SimpleFiringBoss.prototype.updateFunction = function() {
    if(this.state.game.time.now > this.nextFireTime && this.alive) {
        this.nextFireTime = this.state.game.time.now + this.firePause;

        var attack = this.attacks.getFirstExists(false);
        var x = this.x + this.width / 2;
        var y = this.y + this.height / 2;
        var attackX = 0, attackY = 0, count = 0;
        angular.forEach(this.state.players.children, function(p) {
            if(p.alive) {
                count += 1;
                attackX += p.x + p.width / 2;
                attackY += p.y + p.height / 2;
            }

        }, this);
        if(count > 0) {
            attackX = attackX / count;
            attackY = attackY / count;
            attack.reset(x, y);

            var distanceX = (attackX - x);
            var x2 = Math.pow(distanceX, 2);
            var distanceY = (attackY - y);
            var y2 = Math.pow(distanceY, 2);
            var distanceFactor = Math.floor(Math.sqrt(x2 + y2));

            attack.body.velocity.x = this.attackSpeed * distanceX / distanceFactor;
            attack.body.velocity.y = this.attackSpeed * distanceY / distanceFactor;
        }
    }
    this.state.game.physics.arcade.overlap(this.state.players, this.attacks, this.attackHitsPlayer, null, this);
};

SimpleFiringBoss.prototype.attackHitsPlayer = function(player, attack) {
    this.state.enemyHitsPlayer(player);
    attack.kill();
};
