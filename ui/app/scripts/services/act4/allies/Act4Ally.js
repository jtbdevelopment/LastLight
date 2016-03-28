/* globals Phaser: false */
'use strict';

var Act4Ally = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.name = 'Act4Ally';

    this.moveSpeed = 15;
    this.MAX_PATROL_Y_TILE = 26;
    this.MIN_PATROL_Y_TILE = 9;
    this.nextFireTime = 0;
    this.nextFindPathTime = 0;
    this.initialX = x;
    this.initialY = y;
};

Act4Ally.prototype = Object.create(Phaser.Sprite.prototype);
Act4Ally.prototype.constructor = Act4Ally;

Act4Ally.prototype.reset = function (x, y, health) {
    Phaser.Component.Reset.prototype.reset.call(this, x, y, health);
    this.initialX = x;
    this.initialY = y;
    this.initialTiles = this.state.calculator.calcSpriteTiles(this);
    this.pathFindingGoalReached();
};

Act4Ally.prototype.fireAtEnemy = function (closestOpponent) {
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    var arrow = this.state.arrowsGroup.getFirstExists(false);
    arrow.reset(this.state.calculator.calcSpriteCenterX(this), this.state.calculator.calcSpriteCenterY(this));
    arrow.initialX = arrow.x;
    arrow.initialY = arrow.y;
    arrow.firer = this;
    arrow.body.velocity.x = this.state.ALLY_ARROW_SPEED * closestOpponent.distance.distanceX / closestOpponent.distance.distance;
    arrow.body.velocity.y = this.state.ALLY_ARROW_SPEED * closestOpponent.distance.distanceY / closestOpponent.distance.distance;
};

Act4Ally.prototype.randomXPathFindingGoal = function () {
};

Act4Ally.prototype.updatePathFindingGoal = function () {
    this.currentPathFindingGoalXTile = this.initialTiles.tileX + (this.state.game.rnd.integerInRange(0, 5) * this.state.game.rnd.pick([1, -1]));
    if (this.currentPathFindingGoalXTile < 0 ||
        this.currentPathFindingGoalXTile >= this.state.map.width ||
        this.currentPathFindingGoalYTile < 0 ||
        this.currentPathFindingGoalYTile >= this.state.map.height ||
        this.state.blockLayer.layer.data[this.currentPathFindingGoalYTile][this.currentPathFindingGoalXTile].index !== -1) {
        this.updatePathFindingGoal();
    }
};

Act4Ally.prototype.pathFindingGoalReached = function () {
    this.currentPathFindingGoalYTile = (this.currentPathFindingGoalYTile === this.MAX_PATROL_Y_TILE) ? this.MIN_PATROL_Y_TILE : this.MAX_PATROL_Y_TILE;
    this.updatePathFindingGoal();
};

Act4Ally.prototype.updateFunction = function () {
    var closestOpponent = this.state.calculator.findClosestVisibleGroupMember(this, this.state, this.state.enemyGroup, this.state.ALLY_SEE_DISTANCE);
    if (angular.isDefined(closestOpponent.member) && closestOpponent.distance.distance <= this.state.ALLY_SEE_DISTANCE) {
        this.nextFindPathTime = 0;
        if (closestOpponent.distance.distance <= this.state.ALLY_FIRE_DISTANCE) {
            if (this.state.game.time.now > this.nextFireTime) {
                this.nextFireTime = this.state.game.time.now + this.state.ALLY_FIRE_RATE;
                this.fireAtEnemy(closestOpponent);
            }
            else {
                this.state.calculator.moveToPoint(this, closestOpponent.distance, -this.moveSpeed);
            }
        } else if (closestOpponent.distance.distance <= this.state.ALLY_SEE_DISTANCE) {
            this.state.calculator.moveToPoint(this, closestOpponent.distance, this.moveSpeed);
        }
    } else {
        this.state.calculator.performPathFind(this);
    }
};


