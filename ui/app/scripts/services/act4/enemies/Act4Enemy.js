/* globals Phaser: false */
'use strict';

var Act4Enemy = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.name = 'Act4Enemy';

    this.MOVE_SPEED = 30;
    this.SEE_WALL_TILE = 26;
    this.nextFireTime = 0;
    this.nextFindPathTime = 0;
    this.initialX = x;
    this.initialY = y;
};

Act4Enemy.prototype = Object.create(Phaser.Sprite.prototype);
Act4Enemy.prototype.constructor = Act4Enemy;

Act4Enemy.prototype.randomXPathFindingGoal = function () {
    this.currentPathFindingGoalXPosition = Math.max(
        0,
        this.initialX + (this.state.game.rnd.integerInRange(0, 60) * this.state.game.rnd.pick([1, -1]))
    );
    this.currentPathFindingGoalXTile = Math.floor(this.currentPathFindingGoalXPosition / this.state.map.tileWidth);
};

Act4Enemy.prototype.updatePathFindingGoal = function () {
    this.currentPathFindingGoalYTile = this.SEE_WALL_TILE;
    this.randomXPathFindingGoal();
};

Act4Enemy.prototype.resetEnemy = function (x, y, health, damage, size) {
    Phaser.Component.Reset.prototype.reset.call(this, x, y, health);
    this.initialX = x;
    this.initialY = y;
    this.updatePathFindingGoal();
    this.damage = damage;
    this.body.height = size * this.state.scale;
    this.body.width = size * this.state.scale;
    this.height = size;
    this.width = size;
};

Act4Enemy.prototype.activateFunction = function (health, damage, size) {
    this.health = health;
    this.damage = damage;
    this.body.height = size * this.state.scale;
    this.body.width = size * this.state.scale;
    this.height = size;
    this.width = size;
};

Act4Enemy.prototype.pathFindingGoalReached = function () {
    this.body.velocity.x = 0;
    this.body.velocity.y = this.MOVE_SPEED;
};


Act4Enemy.prototype.updateFunction = function () {
    var closestOpponent = this.state.calculator.findClosestOpponent(this, this.state, this.state.alliesGroup, this.state.ENEMY_SEE_DISTANCE);
    if (angular.isDefined(closestOpponent.opponent)) {
        this.state.calculator.moveToPoint(this, closestOpponent.distance, this.MOVE_SPEED);
    } else {
        var tileX = Math.round(this.x / this.state.map.tileWidth);
        var tileY = Math.round(this.y / this.state.map.tileHeight);
        if (tileX === this.currentPathFindingGoalXTile && tileY === this.currentPathFindingGoalYTile) {
            this.pathFindingGoalReached();
        } else {
            if (this.state.game.time.now > this.nextFindPathTime) {
                this.nextFindPathTime = this.state.game.time.now + this.state.FIND_PATH_FREQUENCY;
                var body = this;
                this.state.easyStar.findPath(tileX, tileY, this.currentPathFindingGoalXTile, this.currentPathFindingGoalYTile, function (path) {
                    if (angular.isDefined(path) && path !== null) {
                        var calculated = path[1];
                        var xGoal = (calculated.x * body.state.map.tileWidth) + (body.state.map.tileWidth / 2);
                        var yGoal = (calculated.y * body.state.map.tileHeight) + (body.state.map.tileHeight / 2);
                        var distance = body.state.calculator.calcDistanceSpriteToPoint(body, xGoal, yGoal);
                        body.state.calculator.moveToPoint(body, distance, body.MOVE_SPEED);
                    } else {
                        body.randomXPathFindingGoal();
                    }
                });
            }
        }
    }
};

