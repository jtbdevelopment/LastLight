/* globals AbstractAct1Enemy: false */
'use strict';

var Act2TownsPerson = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.name = 'Act2TownsPerson';
    this.state = undefined;
    this.settings = undefined;
};

Act2TownsPerson.prototype = Object.create(Phaser.Sprite.prototype);
Act2TownsPerson.prototype.constructor = Act2TownsPerson;

Act2TownsPerson.prototype.reset = function (x, y, health) {
    Phaser.Component.Reset.prototype.reset.call(this, x, y, health);
    this.body.setCircle(10);
    this.initialX = x;
    this.initialY = y;
    this.minX = this.initialX - this.settings.ENEMY_PATROL_RANGE;
    this.maxX = this.initialX + this.settings.ENEMY_PATROL_RANGE;
    this.minY = this.initialY - this.settings.ENEMY_PATROL_RANGE;
    this.maxY = this.initialY + this.settings.ENEMY_PATROL_RANGE;
    this.isChasing = false;
    this.stopChasingCount = 0;

    this.body.debug = this.state.DEBUG;
    this.body.collideWorldBounds = true;
    this.body.fixedRotation = true;
    //this.randomizeDirection();
    this.body.setZeroDamping();
    this.safe = false;
};

Act2TownsPerson.prototype.updateFunction = function () {
    /*
     if (this.checkIfEnemyWillChasePlayer()) {
     this.chasePlayer();
     } else {
     this.patrol();
     }
     */
};

Act2TownsPerson.prototype.checkIfEnemyWillChasePlayer = function () {
    //  TODO - Play sound while chasing or play sound when chase begins?
    var wasChasing = this.isChasing;
    this.isChasing = false;

    this.isChasing = this.checkIfEnemySeesPlayer();

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

Act2TownsPerson.prototype.checkIfEnemySeesPlayer = function () {
    this.closestOpponent = this.state.calculator.findClosestOpponent(this, this.state, this.state.playerGroup, this.state.demonMaxSight, this.rayDoesNotHitAnyRocks);
    return angular.isDefined(this.closestOpponent.opponent);
};

Act2TownsPerson.prototype.rayDoesNotHitAnyRocks = function (ray) {
    var rocksHit = [];
    if (angular.isDefined(this.state.movableGroup)) {
        var lineCoordinates = ray.coordinatesOnLine(1);
        angular.forEach(lineCoordinates, function (point) {
            this.game.physics.p2.hitTest({
                x: point[0],
                y: point[1]
            }, this.state.movableGroup.children, undefined, true).forEach(function (hit) {
                rocksHit.push(hit);
            });
        }, this);
    }
    return rocksHit.length === 0;
};

Act2TownsPerson.prototype.chasePlayer = function () {
    this.currentPathFindingGoalSprite = this.state.player;
    this.MOVE_SPEED = this.settings.ENEMY_CHASE_SPEED;
    this.state.calculator.performPathFind(this);
};

Act2TownsPerson.prototype.patrol = function () {
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

Act2TownsPerson.prototype.randomizeDirection = function () {
    var signX = this.state.game.rnd.sign();
    var signY = this.state.game.rnd.sign();
    var percent = this.state.game.rnd.integerInRange(0, 100) / 100;
    this.body.velocity.x = this.settings.ENEMY_PATROL_SPEED * percent * signX;
    this.body.velocity.y = this.settings.ENEMY_PATROL_SPEED * (1 - percent) * signY;
};


