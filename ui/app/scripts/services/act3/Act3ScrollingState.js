/* globals Phaser: true */
'use strict';

angular.module('uiApp').factory('Act3ScrollingState',
    ['$timeout', 'Act3Settings',
        function ($timeout, Act3Settings) {
            return {
                game: undefined,
                load: undefined,
                data: undefined,
                state: undefined,

                bossUpdateFunction: undefined,

                PLAYER_HELPERS: 6,
                PLAYER_MOVE_SPEED: 4,
                PLAYER_FIRE_FREQUENCY: 500,
                PLAYER_ARROW_VELOCITY: 300,

                PLAYER_REVIVE_RATE: 30 * 1000,
                PLAYER_INVULNERABLE_RATE: 10 * 1000,

                PLAYER_LIGHT_RADIUS: 75,

                DEBUG: false,

                //  Phaser state functions - begin
                init: function (level, arrowsRemaining) {
                    this.bossUpdateFunction = undefined;

                    this.level = level;
                    this.arrowsRemaining = arrowsRemaining;
                    this.nextEligibleFiringTime = 0;
                    this.levelData = Act3Settings.levelData[this.level];
                    this.waveCounter = 0;
                    this.enemyWaves = this.levelData.enemyWaves;
                    this.totalWaves = this.enemyWaves.length;
                    this.currentPlayerFormation = this.levelData.startingFormation;
                },
                preload: function () {
                    //  TODO - actual art
                    //  TODO - physics for art
                    //  https://code.google.com/p/box2d-editor/
                    //  http://phaser.io/examples/v2/p2-physics/load-polygon-1
                    //  TODO - music
                    this.load.image('player', 'images/HB_Dwarf05.png');
                    this.load.image('demon', 'images/DemonMinorFighter.png');
                    this.load.image('arrow', 'images/enemy-bullet.png');

                    angular.forEach(this.levelData.additionalImages, function(value, key) {
                        this.load.image(key, value);
                    }, this);
                },
                create: function () {
                    this.game.ending = false;
                    this.game.physics.startSystem(Phaser.Physics.ARCADE);
                    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                    this.game.world.resize(this.game.width, this.game.height);
                    this.game.physics.arcade.setBoundsToWorld(true, true, true, true, false);
                    this.createPlayerGroup();
                    this.createArrowGroup();
                    this.createEnemies();
                    this.createBoss();
                    this.initializeWorldShadowing();
                    this.initializeArrowTracker();
                    this.initializeKeyboard();
                    $timeout(this.revivePlayer, this.PLAYER_REVIVE_RATE, true, this);
                    $timeout(this.nextEnemyWave, this.enemyWaves[0].waitTime * 1000, true, this);
                },
                update: function () {
                    if (!this.game.ending) {
                        this.handlePlayerMovement();
                        this.enemies.forEachAlive(function (e) {
                            if (!e.body.collideWorldBounds) {
                                if (e.x >= 0 &&
                                    e.x <= (this.game.width - e.width) &&
                                    e.y >= 0 &&
                                    e.y <= (this.game.height - e.height)
                                ) {
                                    e.body.collideWorldBounds = true;
                                }

                            } else {
                                var playerCenter = this.calcPlayerGroupCenter();
                                if (playerCenter.count > 0) {
                                    var speed = (Math.abs(e.body.velocity.x) + Math.abs(e.body.velocity.y));
                                    var distance = this.calcDistance(playerCenter, e.x + e.width / 2, e.y + e.height / 2);
                                    e.body.velocity.x += this.levelData.enemyTurnRate * distance.distanceX / distance.distanceFactor;
                                    e.body.velocity.y += this.levelData.enemyTurnRate * distance.distanceY / distance.distanceFactor;
                                    var total = speed / (Math.abs(e.body.velocity.x) + Math.abs(e.body.velocity.y));
                                    e.body.velocity.x *= total;
                                    e.body.velocity.y *= total;
                                }
                            }
                        }, this);
                        this.game.physics.arcade.overlap(this.arrows, this.enemies, this.arrowHitsEnemy, null, this);
                        this.game.physics.arcade.overlap(this.players, this.enemies, this.enemyHitsPlayer, null, this);
                        if (angular.isDefined(this.bossUpdateFunction)) {
                            this.bossUpdateFunction.call(this.boss);
                        }
                        this.updateWorldShadowAndLights();
                    }
                },
                render: function () {
                    if (this.DEBUG) {
                        this.game.debug.cameraInfo(this.game.camera, 10, 20);
                        angular.forEach(this.players.children, function (p, index) {
                            this.game.debug.spriteInfo(p, index * 350, 100);
                            this.game.debug.body(p);
                        }, this);
                        angular.forEach(this.arrows.children, function (a) {
                            this.game.debug.body(a);
                        }, this);
                        angular.forEach(this.enemies.children, function (a) {
                            this.game.debug.body(a);
                        }, this);
                    }
                },
                //  Phaser state functions - end

                //  Creation functions - begin
                createPlayerHelper: function (x, y) {
                    var player = this.players.create(x, y, 'player');
                    player.body.collideWorldBounds = false;  // compute it instead for consistent formation
                    player.body.debug = this.DEBUG;
                    // TODO - real height
                    player.height = Act3Settings.PLAYER_HEIGHT;
                    player.width = Act3Settings.PLAYER_WIDTH;
                    player.invulnerable = false;
                    this.playerTween.push(this.game.add.tween(player));
                    return player;
                },
                createPlayerGroup: function () {
                    this.playerTween = [];
                    this.players = this.game.add.group();
                    this.players.enableBody = true;
                    this.players.physicsBodyType = Phaser.Physics.ARCADE;
                    var x = this.levelData.startingX;
                    var y = this.levelData.startingY;
                    for (var i = 0; i < this.PLAYER_HELPERS; ++i) {
                        this.createPlayerHelper(x, y);
                    }
                    this.game.camera.follow(this.players.children[0]);
                    //  TODO
                    this.switchFormation(undefined, this.currentPlayerFormation);
                },
                createArrowGroup: function () {
                    this.arrows = this.game.add.group();
                    this.arrows.enableBody = true;
                    this.arrows.physicsBodyType = Phaser.Physics.ARCADE;
                    this.arrows.createMultiple(50, 'arrow');
                    this.arrows.setAll('checkWorldBounds', true);
                    this.arrows.setAll('body.debug', this.DEBUG);
                    this.arrows.setAll('anchor.x', 0.0);
                    this.arrows.setAll('anchor.y', 0.0);
                    this.arrows.setAll('outOfBoundsKill', true);
                    this.arrows.setAll('height', 5);
                    this.arrows.setAll('width', 5);
                },
                createEnemies: function () {
                    this.enemies = this.game.add.group();
                    this.enemies.enableBody = true;
                    this.enemies.physicsBodyType = Phaser.Physics.ARCADE;
                    this.enemyHealthGroups = {};
                    angular.forEach(Act3Settings.spawnHealthLevels, function (healthLevel) {
                        var group = this.game.add.group();
                        group.enableBody = true;
                        group.physicsBodyType = Phaser.Physics.ARCADE;
                        group.createMultiple(50, 'demon');
                        group.setAll('checkWorldBounds', false);
                        group.setAll('body.debug', this.DEBUG);
                        group.setAll('anchor.x', 0.0);
                        group.setAll('anchor.y', 0.0);
                        group.setAll('outOfBoundsKill', false);
                        var height = Act3Settings.baseSpawnSize + Math.floor(healthLevel / Act3Settings.maxSpawnHealthLevel * Act3Settings.scaleSpawnSize);
                        var width = Act3Settings.baseSpawnSize + Math.floor(healthLevel / Act3Settings.maxSpawnHealthLevel * Act3Settings.scaleSpawnSize);
                        group.setAll('height', height);
                        group.setAll('width', width);
                        group.setAll('body.height', height);
                        group.setAll('body.width', width);
                        group.setAll('body.collideWorldBounds', false);
                        group.setAll('body.bounce.x', 1);
                        group.setAll('body.bounce.y', 1);
                        this.enemyHealthGroups[healthLevel] = group;
                    }, this);
                },
                createBoss: function () {
                    this.boss = this.game.add.group();
                    this.boss.enableBody = true;
                    this.boss.physicsBodyType = Phaser.Physics.ARCADE;
                    this.boss.classType = this.levelData.boss.type;
                    this.boss.createMultiple(1, this.levelData.boss.image);
                    this.boss.setAll('checkWorldBounds', false);
                    this.boss.setAll('body.debug', this.DEBUG);
                    this.boss.setAll('anchor.x', 0.0);
                    this.boss.setAll('anchor.y', 0.0);
                    this.boss.setAll('outOfBoundsKill', false);
                    this.boss.setAll('height', this.levelData.boss.height);
                    this.boss.setAll('width', this.levelData.boss.width);
                    this.boss.setAll('body.height', this.levelData.boss.height);
                    this.boss.setAll('body.width', this.levelData.boss.width);
                    this.boss.setAll('body.collideWorldBounds', true);
                    this.boss.setAll('body.bounce.x', 1);
                    this.boss.setAll('body.bounce.y', 1);
                    this.boss.setAll('state', this);

                    var boss = this.boss.getFirstExists(false);
                    boss.health = this.levelData.boss.health;
                },
                initializeWorldShadowing: function () {
                    this.shadowTexture = this.game.add.bitmapData(this.game.world.width * 2, this.game.world.height * 2);
                    this.lightSprite = this.game.add.image(0, 0, this.shadowTexture);
                    this.lightSprite.blendMode = Phaser.blendModes.MULTIPLY;
                },
                initializeKeyboard: function () {
                    this.cursors = this.game.input.keyboard.createCursorKeys();
                    this.formationKeys = [];
                    this.formationKeys.push(this.game.input.keyboard.addKey(Phaser.Keyboard.ONE));
                    this.formationKeys.push(this.game.input.keyboard.addKey(Phaser.Keyboard.TWO));
                    this.formationKeys.push(this.game.input.keyboard.addKey(Phaser.Keyboard.THREE));
                    this.formationKeys.push(this.game.input.keyboard.addKey(Phaser.Keyboard.FOUR));
                    angular.forEach(this.formationKeys, function (key, index) {
                        key.onUp.add(this.switchFormation, this, 100, index + 1);
                    }, this);
                    this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onUp.add(this.fireArrows, this);
                },
                initializeArrowTracker: function () {
                    if (this.arrowsRemaining > 0) {
                        var textStyle = {
                            font: '10px Arial',
                            fill: '#FF9329',
                            align: 'left'
                        };
                        this.arrowText = this.game.add.text(0, 0, this.makeArrowText(), textStyle);
                        this.arrowText.fixedToCamera = true;
                        this.arrowText.cameraOffset.setTo(0, 0);
                    }
                },
                //  Creation functions - end

                //  Arrow related - begin
                makeArrowText: function () {
                    return 'Arrows: ' + this.arrowsRemaining;
                },

                drawCircleOfLight: function (sprite, lightRadius) {
                    var radius = lightRadius + this.game.rnd.integerInRange(1, 10);
                    var gradient = this.shadowTexture.context.createRadialGradient(
                        sprite.x, sprite.y, lightRadius * 0.25,
                        sprite.x, sprite.y, radius);
                    gradient.addColorStop(0, 'rgba(225, 225, 225, 0.5)');
                    gradient.addColorStop(1, 'rgba(225, 225, 225, 0.0)');

                    this.shadowTexture.context.beginPath();
                    this.shadowTexture.context.fillStyle = gradient;
                    this.shadowTexture.context.arc(sprite.x, sprite.y, radius, 0, Math.PI * 2, false);
                    this.shadowTexture.context.fill();
                },
                updateWorldShadowAndLights: function () {
                    //  TODO - make a gamma slider  (10, 20,50)

                    this.shadowTexture.context.fillStyle = 'rgb(100, 120, 150)';
                    this.shadowTexture.context.fillRect(0, 0, this.game.world.width, this.game.world.height);

                    angular.forEach(this.players.children, function (p) {
                        this.drawCircleOfLight(p, this.PLAYER_LIGHT_RADIUS);
                    }, this);
                    this.shadowTexture.dirty = true;
                },
                //  Arrow related -end

                nextEnemyWave: function (state) {
                    if (!state.game.ending) {

                        var waveData = state.enemyWaves[state.waveCounter];

                        var speed = state.levelData.enemySpeed;
                        var velX = waveData.xSpeed * speed / 100;
                        var xAdjust = velX / -speed;
                        var velY = waveData.ySpeed * speed / 100;
                        var yAdjust = velY / speed;
                        var startX = waveData.x;
                        var startY = waveData.y;
                        var enemies = waveData.count;
                        var health = waveData.health;
                        for (var i = 0; i < enemies; ++i) {
                            var enemy = state.enemyHealthGroups[health].getFirstExists(false);
                            state.enemyHealthGroups[health].remove(enemy);
                            state.enemies.add(enemy);
                            var x = startX + (enemy.width * i * xAdjust),
                                y = startY - (enemy.height * i * yAdjust);

                            enemy.body.collideWorldBounds = false;
                            enemy.reset(x, y);
                            enemy.initialHealth = health;
                            enemy.health = enemy.initialHealth;
                            enemy.body.velocity.x = velX;
                            enemy.body.velocity.y = velY;
                        }
                        state.waveCounter += 1;
                        if (state.waveCounter < state.totalWaves) {
                            $timeout(state.nextEnemyWave, state.enemyWaves[state.waveCounter].waitTime * 1000, true, state);
                        } else {
                            //  TODO - timer config
                            $timeout(state.spawnBoss, state.levelData.boss.waitTime * 1000, true, state);
                        }
                    }
                },
                spawnBoss: function (state) {
                    if (!state.game.ending) {
                        var boss = state.boss.getFirstExists(false);
                        state.bossUpdateFunction = boss.updateFunction;
                        boss.reset(state.levelData.boss.x, state.levelData.boss.y);
                        state.enemies.add(boss);
                        boss.health = state.levelData.boss.health;
                        boss.timeout = $timeout;
                        boss.bossLoaded();
                        state.boss = boss;
                    }
                },

                //  Player action and movement - begin
                makeVulnerable: function (player) {
                    //  TODO - show
                    player.invulnerable = false;
                },
                revivePlayer: function (state) {
                    if(!state.game.ending) {
                        var dead = state.players.getFirstDead();
                        if (dead !== null && angular.isDefined(dead)) {
                            dead.reset(0, 0);
                            dead.invulnerable = true;
                            //  TODO - sound, make invulnerable visible
                            $timeout(state.makeVulnerable, state.PLAYER_INVULNERABLE_RATE, true, dead);
                            state.moveHelpers();
                        }
                        $timeout(state.revivePlayer, state.PLAYER_REVIVE_RATE, true, state);
                    }
                },
                fireArrows: function () {
                    if (angular.isDefined(this.nextEligibleFiringTime) && this.game.time.now > this.nextEligibleFiringTime) {
                        if (this.arrowsRemaining > 0) {
                            angular.forEach(this.players.children, function (p, index) {
                                if (p.alive) {
                                    var arrow = this.arrows.getFirstExists(false);
                                    var x = 0, y = 0, velX = 0, velY = 0;

                                    switch (this.currentPlayerFormation) {
                                        case Act3Settings.VERTICAL_FORMATION:
                                            if (index < 3) {
                                                x = p.x;
                                                y = p.y + (p.height / 2);
                                                velX = -this.PLAYER_ARROW_VELOCITY;
                                            } else {
                                                x = p.x + p.width;
                                                y = p.y + (p.height / 2);
                                                velX = this.PLAYER_ARROW_VELOCITY;
                                            }
                                            break;
                                        case Act3Settings.HORIZONTAL_FORMATION:
                                            switch (index) {
                                                case 0:
                                                case 3:
                                                case 4:
                                                    x = p.x + (p.width / 2);
                                                    y = p.y;
                                                    velY = -this.PLAYER_ARROW_VELOCITY;
                                                    break;
                                                case 1:
                                                case 2:
                                                case 5:
                                                    x = p.x + (p.width / 2);
                                                    y = p.y + p.height;
                                                    velY = this.PLAYER_ARROW_VELOCITY;
                                                    break;
                                            }
                                            break;
                                        case Act3Settings.WEDGE_FORMATION:
                                            x = p.x + p.width;
                                            y = p.y + (p.height / 2);
                                            velX = this.PLAYER_ARROW_VELOCITY;
                                            break;
                                        case Act3Settings.BLOCK_FORMATION:
                                            switch (index) {
                                                case 0:
                                                case 3:
                                                    x = p.x + (p.width / 2);
                                                    y = p.y;
                                                    velY = -this.PLAYER_ARROW_VELOCITY;
                                                    break;
                                                case 4:
                                                    x = p.x + p.width;
                                                    y = p.y + (p.height / 2);
                                                    velX = this.PLAYER_ARROW_VELOCITY;
                                                    break;
                                                case 1:
                                                    x = p.x;
                                                    y = p.y + (p.height / 2);
                                                    velX = -this.PLAYER_ARROW_VELOCITY;
                                                    break;
                                                case 2:
                                                case 5:
                                                    x = p.x + (p.width / 2);
                                                    y = p.y;
                                                    velY = this.PLAYER_ARROW_VELOCITY;
                                                    break;
                                            }
                                            break;
                                    }
                                    arrow.reset(x, y);
                                    arrow.body.velocity.x = velX;
                                    arrow.body.velocity.y = velY;
                                }
                            }, this);
                            this.arrowsRemaining = this.arrowsRemaining - 1;
                            this.nextEligibleFiringTime = this.game.time.now += this.PLAYER_FIRE_FREQUENCY;
                            this.arrowText.text = this.makeArrowText();
                            if (this.arrowsRemaining === 0) {
                                this.failure();
                            }
                        } else {
                            // TODO
                        }
                    }
                },
                switchFormation: function (event, formation) {
                    this.currentPlayerFormation = formation;
                    //  TODO - ROTATE PLAYERS?
                    this.moveHelpers();
                },
                calcDistance: function (playerCenter, x, y) {
                    var distanceX = (playerCenter.attackX - x);
                    var x2 = Math.pow(distanceX, 2);
                    var distanceY = (playerCenter.attackY - y);
                    var y2 = Math.pow(distanceY, 2);
                    var distanceFactor = Math.floor(Math.sqrt(x2 + y2));
                    return {distanceX: distanceX, distanceY: distanceY, distanceFactor: distanceFactor};
                },
                calcPlayerGroupCenter: function () {
                    var attackX = 0, attackY = 0, count = 0;
                    angular.forEach(this.players.children, function (p) {
                        if (p.alive) {
                            count += 1;
                            attackX += p.x + p.width / 2;
                            attackY += p.y + p.height / 2;
                        }

                    }, this);
                    if (count > 0) {
                        attackX = attackX / count;
                        attackY = attackY / count;
                    }
                    return {attackX: attackX, attackY: attackY, count: count};
                },
                handlePlayerMovement: function () {
                    var moved = false;
                    //  This gives time for tweens to run
                    if (angular.isUndefined(this.movedLast)) {
                        this.movedLast = false;
                    }
                    if (!this.movedLast) {
                        if (this.cursors.up.isDown) {
                            angular.forEach(this.players.children, function (player) {
                                player.y -= this.PLAYER_MOVE_SPEED;
                            }, this);
                            //this.players.children[0].y -= this.PLAYER_MOVE_SPEED;
                            moved = true;
                        }
                        if (this.cursors.down.isDown) {
                            angular.forEach(this.players.children, function (player) {
                                player.y += this.PLAYER_MOVE_SPEED;
                            }, this);
                            //this.players.children[0].y += this.PLAYER_MOVE_SPEED;
                            moved = true;
                        }
                        if (this.cursors.left.isDown) {
                            angular.forEach(this.players.children, function (player) {
                                player.x -= this.PLAYER_MOVE_SPEED;
                            }, this);

                            //this.players.children[0].x -= this.PLAYER_MOVE_SPEED;
                            moved = true;
                        }
                        if (this.cursors.right.isDown) {
                            angular.forEach(this.players.children, function (player) {
                                player.x += this.PLAYER_MOVE_SPEED;
                            }, this);
                            //this.players.children[0].x += this.PLAYER_MOVE_SPEED;
                            moved = true;
                        }
                        if (moved) {
                            this.moveHelpers();
                            this.movedLast = true;
                        }
                    } else {
                        this.movedLast = false;
                    }
                },
                moveHelpers: function () {
                    angular.forEach(this.players.children,
                        function (p, index) {
                            if (p.alive) {
                                var x = this.players.children[0].x, y = this.players.children[0].y;
                                switch (this.currentPlayerFormation) {
                                    case Act3Settings.VERTICAL_FORMATION:
                                        if (index < 3) {
                                            y += (index * p.height);
                                        } else {
                                            x += p.width;
                                            y += ((index - 3) * p.height);
                                        }
                                        break;
                                    case Act3Settings.HORIZONTAL_FORMATION:
                                        switch (index) {
                                            case 0:
                                                break;
                                            case 3:
                                                x += p.width;
                                                break;
                                            case 4:
                                                x += (p.width * 2);
                                                break;
                                            case 1:
                                                y += p.height;
                                                break;
                                            case 2:
                                                x += p.width;
                                                y += p.height;
                                                break;
                                            case 5:
                                                x += (p.width * 2);
                                                y += p.height;
                                                break;
                                        }
                                        break;
                                    case Act3Settings.BLOCK_FORMATION:
                                        switch (index) {
                                            case 0:   //  upper left
                                                break;
                                            case 1:   //mid left
                                                y += (p.height / 2);
                                                x += p.width;
                                                break;
                                            case 2:   // lower left
                                                y += p.height;
                                                break;
                                            case 3:  // upper right
                                                x += (p.width * 3);
                                                break;
                                            case 4:  // mid right
                                                y += (p.height / 2);
                                                x += (p.width * 2);
                                                break;
                                            case 5:  // lower right
                                                y += p.height;
                                                x += (p.width * 3);
                                                break;
                                        }
                                        break;
                                    case Act3Settings.WEDGE_FORMATION:
                                        switch (index) {
                                            case 0:   //  upper left
                                                break;
                                            case 1:   //  back left
                                                y += (p.height * 1);
                                                break;
                                            case 2:   //  lower left
                                                y += (p.height * 2);
                                                break;
                                            case 3:   //  mid upper
                                                x += p.width;
                                                y += (p.height / 2);
                                                break;
                                            case 4:   // wedge point
                                                y += (p.height * 1);
                                                x += (p.width * 2);
                                                break;
                                            case 5:   // mid lower
                                                y += (p.height * 1.5);
                                                x += p.width;
                                                break;
                                        }
                                        break;
                                }

                                var adjustX = 0, adjustY = 0;
                                if (x < 0) {
                                    adjustX = -x;
                                } else if ((x + p.width) > this.game.width) {
                                    adjustX = this.game.width - x - p.width;
                                }
                                if (y < 0) {
                                    adjustY = -y;
                                } else if ((y + p.height) > this.game.height) {
                                    adjustY = this.game.height - y - p.height;
                                }
                                if (adjustX !== 0 || adjustY !== 0) {
                                    this.players.children[0].x += adjustX;
                                    this.players.children[0].y += adjustY;
                                    this.moveHelpers();
                                } else {
                                    var x2 = Math.pow((p.x - x), 2);
                                    var y2 = Math.pow((p.y - y), 2);
                                    var distanceFactor = Math.floor(Math.sqrt(x2 + y2) / this.PLAYER_MOVE_SPEED);
                                    var tween = this.playerTween[index];
                                    tween.stop();
                                    tween = this.game.add.tween(p);
                                    this.playerTween[index] = tween;
                                    tween.to({
                                        x: x,
                                        y: y
                                    }, 8 * distanceFactor, null, true);
                                }
                            }
                        }, this);
                },
//  Player action and movement - end

//  collision handlers
                arrowHitsEnemy: function (arrow, enemy) {
                    arrow.kill();
                    //  TODO - kill tween
                    enemy.health -= 1;
                    if (enemy.health <= 0) {
                        enemy.kill();
                        this.enemies.remove(enemy);
                        if (angular.isDefined(enemy.initialHealth)) {
                            this.enemyHealthGroups[enemy.initialHealth].add(enemy);
                        }
                        if (this.enemies.countLiving() === 0) {
                            if (this.waveSpawnCounter === this.MAX_TIMER) {
                                this.winEnding();
                            }
                        }
                    }
                },
                enemyHitsPlayer: function (player) {
                    if (!player.invulnerable) {
                        player.kill();
                        this.players.remove(player, false);
                        this.players.add(player);
                        //  TODO - death tween
                        if (this.players.countLiving() === 0) {
                            this.failure();
                        } else {
                            this.moveHelpers();
                        }
                    }
                },
//  Ending related
                failure: function () {
                    this.game.ending = true;
                    this.enemies.forEachAlive(function (enemy) {
                        enemy.kill();
                    });
                    var deathTween = this.game.add.tween(this);
                    deathTween.to({PLAYER_LIGHT_RADIUS: 0}, 1000, Phaser.Easing.Power1, true);
                },

                winEnding: function () {
                    this.game.ending = true;
                    var winTween = this.game.add.tween(this);
                    winTween.to({PLAYER_LIGHT_RADIUS: 100}, 1000, Phaser.Easing.Power1, true);
                    winTween.onComplete.add(function () {
                        //  TODO - End of Act
                        //  TODO - interludes
                        //  TODO - retry move on option
                        //  TODO - add arrows?
                        this.game.state.start(this.state.current, true, false, this.level + 1, this.arrowsRemaining + this.levelData.addArrowsAtEnd);
                    }, this);
                }
            };
        }
    ]
);
