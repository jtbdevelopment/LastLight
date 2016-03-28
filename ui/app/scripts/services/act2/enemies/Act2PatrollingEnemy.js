/* globals Phaser: false */
'use strict';

var Act2PatrollingEnemy = function (game, x, y, key, frame) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.name = 'Act2PatrollingEnemy';
    this.state = undefined;
    this.settings = undefined;
};

Act2PatrollingEnemy.prototype = Object.create(Phaser.Sprite.prototype);
Act2PatrollingEnemy.prototype.constructor = Act2PatrollingEnemy;

Act2PatrollingEnemy.prototype.reset = function (x, y, health) {
    Phaser.Component.Reset.prototype.reset.call(this, x, y, health);
    this.body.setCircle(10);
    this.initialX = x;
    this.initialY = y;
    this.stunTime = 0;
    this.stunned = false;
    this.recheckGoalTime = 0;
    this.nextFindPathTime = 0;

    this.moveSpeed = 10;

    this.body.debug = this.state.DEBUG;
    this.body.collideWorldBounds = true;
    this.body.fixedRotation = true;
    this.body.setZeroDamping();
    this.updatePathFindingGoal();
};

Act2PatrollingEnemy.prototype.updateFunction = function () {
    if (this.stunned && this.state.game.time.now > this.stunTime) {
        this.stunned = false;
        this.updatePathFindingGoal();
    }
    if (this.stunned === false) {
        if (this.state.game.time.now > this.recheckGoalTime) {
            this.recheckGoalTime = this.state.game.time.now + 500;
            this.updatePathFindingGoal();
        }
        this.state.calculator.performPathFind(this);
    }
};

Act2PatrollingEnemy.prototype.updatePathFindingGoal = function () {
    var possibleAttacks = [];
    if (angular.isDefined(this.state.player)) {
        possibleAttacks.push(this.state.player);
    }
    if (angular.isDefined(this.state.peopleGroup)) {
        possibleAttacks = possibleAttacks.concat(this.state.peopleGroup.filter(function (person) {
            return !person.safe && person.alive;
        }, true).list);
    }
    var closest = this.state.calculator.findClosest(this, this.state, possibleAttacks).member;
    if (angular.isDefined(closest)) {
        var tiles = this.state.calculator.calcSpriteTiles(closest);
        this.currentPathFindingGoalYTile = tiles.tileY;
        this.currentPathFindingGoalXTile = tiles.tileX;
    }
};

Act2PatrollingEnemy.prototype.pathFindingGoalReached = function () {
    this.updatePathFindingGoal();
};


