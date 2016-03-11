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

Act4Enemy.prototype.reset = function (x, y, health) {
    Phaser.Component.Reset.prototype.reset.call(this, x, y, health);
    this.initialX = x;
    this.initialY = y;
    this.currentPathFindingGoalYTile = this.SEE_WALL_TILE;
    this.currentPathFindingGoalYPosition = this.currentPathFindingGoalYTile * this.state.map.tileHeight;
    this.currentPathFindingGoalXPosition = x;
    this.currentPathFindingGoalXTile = Math.floor(this.currentPathFindingGoalXPosition / this.state.map.tileWidth);
};

Act4Enemy.prototype.activateFunction = function (health, damage, size) {
    this.health = health;
    this.damage = damage;
    this.body.height = size * this.state.scale;
    this.body.width = size * this.state.scale;
    this.height = size;
    this.width = size;
};

Act4Enemy.prototype.updateFunction = function () {
    var closestOpponent = this.state.calculator.findClosestOpponent(this, this.state, this.state.alliesGroup, this.state.ENEMY_SEE_DISTANCE);
    if (angular.isDefined(closestOpponent.opponent)) {

    } else {
        var tileX = Math.round(this.x / this.state.map.tileWidth);
        var tileY = Math.round(this.y / this.state.map.tileHeight);
        if (tileX === this.currentPathFindingGoalXTile && tileY === this.currentPathFindingGoalYTile) {
            this.body.velocity.x = 0;
            this.body.velocity.y = this.MOVE_SPEED;
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
                        body.currentPathFindingGoalXTile += 1;
                        body.currentPathFindingGoalXPosition += body.state.map.tileWidth;
                        if (body.currentPathFindingGoalXPosition >= body.state.world.width) {
                            body.currentPathFindingGoalXTile -= 3;
                            body.currentPathFindingGoalXPosition -= (body.state.map.tileWidth * 3);
                        }
                    }
                });
            }
        }
    }
};

