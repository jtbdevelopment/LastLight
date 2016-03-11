/* globals Phaser: false */
'use strict';

var Act4Ally = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.name = 'Act4Ally';

    this.MOVE_SPEED = 15;
    this.MAX_PATROL_Y_TILE = 26;
    this.MIN_PATROL_Y_TILE = 7;
    this.nextFireTime = 0;
    this.nextFindPathTime = 0;
    this.initialX = x;
    this.initialY = y;
};

Act4Ally.prototype = Object.create(Phaser.Sprite.prototype);
Act4Ally.prototype.constructor = Act4Ally;

Act4Ally.prototype.randomXPathFindingGoal = function () {
    this.currentPathFindingGoalXPosition = Math.max(
        0,
        this.initialX + (this.state.game.rnd.integerInRange(0, 50) * this.state.game.rnd.pick([1, -1]))
    );
    this.currentPathFindingGoalXTile = Math.floor(this.currentPathFindingGoalXPosition / this.state.map.tileWidth);
};

Act4Ally.prototype.updatePathFindingGoal = function () {
    this.currentPathFindingGoalYTile = (this.currentPathFindingGoalYTile === this.MAX_PATROL_Y_TILE) ? this.MIN_PATROL_Y_TILE : this.MAX_PATROL_Y_TILE;
    this.currentPathFindingGoalYPosition = this.currentPathFindingGoalYTile * this.state.map.tileHeight;
    this.randomXPathFindingGoal();
};

Act4Ally.prototype.reset = function (x, y, health) {
    Phaser.Component.Reset.prototype.reset.call(this, x, y, health);
    this.initialX = x;
    this.initialY = y;
    this.updatePathFindingGoal();
};

Act4Ally.prototype.fireAtEnemy = function (closestOpponent) {
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    var arrow = this.state.arrowsGroup.getFirstExists(false);
    arrow.reset(Math.floor(this.x + (this.width / 2)), Math.floor(this.y + (this.height / 2)));
    arrow.initialX = arrow.x;
    arrow.initialY = arrow.y;
    arrow.firer = this;
    arrow.body.velocity.x = this.state.ALLY_ARROW_SPEED * closestOpponent.distance.distanceX / closestOpponent.distance.distance;
    arrow.body.velocity.y = this.state.ALLY_ARROW_SPEED * closestOpponent.distance.distanceY / closestOpponent.distance.distance;
};

Act4Ally.prototype.updateFunction = function () {
    var closestOpponent = this.state.calculator.findClosestOpponent(this, this.state, this.state.enemyGroup, this.state.ALLY_SEE_DISTANCE);
    if (angular.isDefined(closestOpponent.opponent) && closestOpponent.distance.distance <= this.state.ALLY_SEE_DISTANCE) {
        this.nextFindPathTime = 0;
        if (closestOpponent.distance.distance <= this.state.ALLY_FIRE_DISTANCE) {
            if (this.state.game.time.now > this.nextFireTime) {
                this.nextFireTime = this.state.game.time.now + this.state.ALLY_FIRE_RATE;
                this.fireAtEnemy(closestOpponent);
            }
            else {
                this.state.calculator.moveToPoint(me, closestOpponent.distance, -this.MOVE_SPEED);
            }
        } else if (closestOpponent.distance.distance <= this.state.ALLY_SEE_DISTANCE) {
            this.state.calculator.moveToPoint(me, closestOpponent.distance, this.MOVE_SPEED);
        }
    } else {
        var tileX = Math.round(this.x / this.state.map.tileWidth);
        var tileY = Math.round(this.y / this.state.map.tileHeight);
        if (tileX === this.currentPathFindingGoalXTile && tileY === this.currentPathFindingGoalYTile) {
            this.updatePathFindingGoal();
        }
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
};


