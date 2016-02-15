/* globals Phaser: false */
/* globals AbstractAct1Enemy: false */
'use strict';

var PatrollingEnemy = function (game, x, y, key, frame) {
    AbstractAct1Enemy.call(this, game, x, y, key, frame);
    this.name = 'PatrollingEnemy';
    this.state = undefined;
    this.settings = undefined;
    this.height = 32;
    this.width = 32;
    this.x += 16;
    this.y -= 16;
};

PatrollingEnemy.prototype = Object.create(AbstractAct1Enemy.prototype);
PatrollingEnemy.prototype.constructor = PatrollingEnemy;

PatrollingEnemy.prototype.initialize = function () {
    this.body.setCircle(11);
    this.initialX = this.x;
    this.initialY = this.y;
    this.minX = this.initialX - this.settings.ENEMY_PATROL_RANGE;
    this.maxX = this.initialX + this.settings.ENEMY_PATROL_RANGE;
    this.minY = this.initialY - this.settings.ENEMY_PATROL_RANGE;
    this.maxY = this.initialY + this.settings.ENEMY_PATROL_RANGE;
    this.isChasing = false;
    this.stopChasingCount = 0;

    this.body.debug = this.state.DEBUG;
    this.body.collideWorldBounds = true;
    this.body.fixedRotation = true;
    this.randomizeDirection();
    this.body.setZeroDamping();
};

PatrollingEnemy.prototype.updateFunction = function (player) {
    AbstractAct1Enemy.prototype.updateFunction.call(this, player);
    if (this.checkIfEnemyWillChasePlayer(player)) {
        this.chasePlayer(player);
    } else {
        this.patrol();
    }
};

PatrollingEnemy.prototype.randomizeDirection = function () {
    var signX = this.state.game.rnd.integerInRange(1, 2);
    var signY = this.state.game.rnd.integerInRange(1, 2);
    var percent = this.state.game.rnd.integerInRange(0, 100) / 100;
    this.body.velocity.x = this.settings.ENEMY_PATROL_SPEED * percent * (signX === 2 ? -1 : 1);
    this.body.velocity.y = this.settings.ENEMY_PATROL_SPEED * (1 - percent) * (signY === 2 ? -1 : 1);
};

PatrollingEnemy.prototype.checkIfEnemyWillChasePlayer = function (player) {
    //  TODO - Play sound while chasing or play sound when chase begins?
    var wasChasing = this.isChasing;
    this.isChasing = false;

    this.isChasing = this.checkIfEnemySeesPlayer(player);

    if (!this.isChasing && wasChasing) {
        this.stopChasingCount++;
        if (this.stopChasingCount < this.settings.ENEMY_STOP_CHASING_AFTER) {
            this.isChasing = true;
        } else {
            this.stopChasingCount = 0;
        }
    }
    return this.isChasing;
};

PatrollingEnemy.prototype.checkIfEnemySeesPlayer = function (player) {
    var ray = new Phaser.Line(this.x, this.y, player.x, player.y);
    if (ray.length < this.state.demonMaxSight) {
        var tileHits = this.state.blockLayer.getRayCastTiles(ray, undefined, true);
        this.state.addTileHitsToDisplay(tileHits);

        var rocksHit = [];
        var lineCoordinates = ray.coordinatesOnLine(1);
        angular.forEach(lineCoordinates, function (point) {
            this.game.physics.p2.hitTest({
                x: point[0],
                y: point[1]
            }, this.state.movableGroup.children, undefined, true).forEach(function (hit) {
                rocksHit.push(hit);
            });
        }, this);
        return tileHits.length === 0 && rocksHit.length === 0;
    }
    return false;
};

PatrollingEnemy.prototype.chasePlayer = function (player) {
    //  TODO - smarter pathing logic - see easystar perhaps
    var angle = Math.atan2(player.y - this.y, player.x - this.x);
    this.body.velocity.x = Math.cos(angle) * this.settings.ENEMY_CHASE_SPEED;
    this.body.velocity.y = Math.sin(angle) * this.settings.ENEMY_CHASE_SPEED;
};

PatrollingEnemy.prototype.patrol = function () {
    var compareX = Math.round(this.x * 100) / 100;
    var compareY = Math.round(this.y * 100) / 100;
    if ((compareX <= this.minX && this.body.velocity.x < 0) ||
        (compareX >= this.maxX && this.body.velocity.x > 0)) {
        this.body.velocity.x *= -1;
    }
    if ((compareY <= this.minY && this.body.velocity.y < 0) ||
        (compareY >= this.maxY && this.body.velocity.y > 0)) {
        this.body.velocity.y *= -1;
    }

    if (Math.abs(this.body.velocity.x) + Math.abs(this.body.velocity.y) < this.settings.ENEMY_PATROL_SPEED / 2) {
        this.randomizeDirection();
    }

};


