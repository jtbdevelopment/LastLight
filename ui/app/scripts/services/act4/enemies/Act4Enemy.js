/* globals Phaser: false */
'use strict';

var Act4Enemy = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.state = undefined;
    this.name = 'Act4Enemy';

    this.moveSpeed = 30;
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

Act4Enemy.prototype.resetEnemy = function (x, y, health, damage, size) {
    Phaser.Component.Reset.prototype.reset.call(this, x, y, health);
    this.initialX = x;
    this.initialY = y;
    this.damage = damage;
    this.body.height = size * this.state.currentScale;
    this.body.width = size * this.state.currentScale;
    this.height = size;
    this.width = size;
    this.updatePathFindingGoal();
};

Act4Enemy.prototype.updatePathFindingGoal = function () {
    this.currentPathFindingGoalYTile = this.SEE_WALL_TILE;
    this.randomXPathFindingGoal();
};

Act4Enemy.prototype.pathFindingGoalReached = function () {
    this.body.velocity.x = 0;
    this.body.velocity.y = this.moveSpeed;
};

Act4Enemy.prototype.updateFunction = function () {
    var closestOpponent = this.state.calculator.findClosestVisibleGroupMember(this, this.state, this.state.alliesGroup, this.state.ENEMY_SEE_DISTANCE);
    if (angular.isDefined(closestOpponent.member)) {
        this.state.calculator.moveToPoint(this, closestOpponent.distance, this.moveSpeed);
    } else {
        this.state.calculator.performPathFind(this);
    }
};

