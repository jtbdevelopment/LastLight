'use strict';

angular.module('uiApp').factory('Act3ScrollingState',
    ['Act3Settings', 'Act3Calculator', 'HelpDisplay', 'Phaser', 'TextFormatter',
        function (Act3Settings, Act3Calculator, HelpDisplay, Phaser, TextFormatter) {
            return {
                game: undefined,
                load: undefined,
                data: undefined,
                state: undefined,
                calculator: Act3Calculator,

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
                    this.level = level;
                    this.arrowsRemaining = arrowsRemaining;
                    this.startingArrows = this.arrowsRemaining;
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

                    angular.forEach(this.levelData.additionalImages, function (value, key) {
                        this.load.image(key, value);
                    }, this);
                },
                create: function () {
                    this.game.ending = false;
                    this.game.physics.startSystem(Phaser.Physics.ARCADE);
                    this.game.resetDefaultSize();
                    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                    this.game.world.resize(this.game.width, this.game.height);
                    this.game.physics.arcade.setBoundsToWorld();
                    this.createPlayerGroup();
                    this.createArrowGroup();
                    this.createEnemies();
                    this.createBoss();
                    this.initializeWorldShadowing();
                    this.initializeArrowTracker();
                    this.initializeKeyboard();
                    this.game.time.events.add(this.PLAYER_REVIVE_RATE, this.revivePlayer, this);
                    this.game.time.events.add(this.enemyWaves[this.waveCounter].waitTime * 1000, this.nextEnemyWave, this);

                    HelpDisplay.initializeHelp(this, Act3Settings.helpText, true);
                },
                update: function () {
                    if (!this.game.ending) {
                        this.handlePlayerMovement();
                        var playerCenter = this.calculator.calcPlayerGroupCenter(this);
                        this.enemies.forEachAlive(function (e) {
                            e.updateFunction(playerCenter);
                        }, this);
                        this.game.physics.arcade.overlap(this.arrows, this.enemies, this.arrowHitsEnemy, null, this);
                        this.game.physics.arcade.overlap(this.players, this.enemies, this.enemyHitsPlayer, null, this);
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
                    player.alive = true;
                    // TODO - real height
                    player.height = Act3Settings.PLAYER_HEIGHT;
                    player.width = Act3Settings.PLAYER_WIDTH;
                    player.invulnerable = false;
                    this.playerTween.push(this.game.add.tween(player));
                    return player;
                },
                createPlayerGroup: function () {
                    this.playerTween = [];
                    this.players = this.game.add.physicsGroup();
                    var x = this.levelData.startingX;
                    var y = this.levelData.startingY;
                    for (var i = 0; i < this.PLAYER_HELPERS; ++i) {
                        this.createPlayerHelper(x, y);
                    }
                    this.game.camera.follow(this.players.children[0]);
                    this.switchFormation(undefined, this.currentPlayerFormation);
                },
                createArrowGroup: function () {
                    this.arrows = this.game.add.physicsGroup();
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
                    this.enemies = this.game.add.physicsGroup();
                    this.enemyGroups = {};
                    angular.forEach(this.enemyWaves, function (wave) {
                        var type = wave.className;
                        if (angular.isUndefined(this.enemyGroups[type])) {
                            var group = this.game.add.physicsGroup();
                            group.classType = wave.type;
                            group.createMultiple(100, wave.image);
                            group.setAll('checkWorldBounds', false);
                            group.setAll('body.debug', this.DEBUG);
                            group.setAll('anchor.x', 0.0);
                            group.setAll('anchor.y', 0.0);
                            group.setAll('outOfBoundsKill', false);
                            group.setAll('body.collideWorldBounds', false);
                            group.setAll('body.bounce.x', 1);
                            group.setAll('body.bounce.y', 1);
                            group.setAll('state', this);
                            this.enemyGroups[type] = group;
                        }
                    }, this);
                },
                createBoss: function () {
                    this.boss = this.game.add.physicsGroup();
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
                    this.boss.setAll('health', this.levelData.boss.health);
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
                        this.arrowText = this.game.add.text(0, 0, this.makeArrowText());
                        TextFormatter.formatTracker(this.arrowText);
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

                nextEnemyWave: function () {
                    if (!this.game.ending) {

                        var waveData = this.enemyWaves[this.waveCounter];

                        var speed = this.levelData.enemySpeed;
                        var velX = waveData.xSpeed * speed / 100;
                        var xAdjust = velX / -speed;
                        var velY = waveData.ySpeed * speed / 100;
                        var yAdjust = velY / speed;
                        var startX = waveData.x;
                        var startY = waveData.y;
                        var enemies = waveData.count;
                        var health = waveData.health;
                        var className = waveData.className;
                        var height = Act3Settings.baseSpawnSize + Math.floor(waveData.health / Act3Settings.maxSpawnHealthLevel * Act3Settings.scaleSpawnSize);
                        var width = Act3Settings.baseSpawnSize + Math.floor(waveData.health / Act3Settings.maxSpawnHealthLevel * Act3Settings.scaleSpawnSize);
                        for (var i = 0; i < enemies; ++i) {
                            var enemy = this.enemyGroups[className].getFirstExists(false);
                            this.enemyGroups[className].remove(enemy);
                            this.enemies.add(enemy);
                            var x = startX + (width * i * xAdjust),
                                y = startY - (height * i * yAdjust);

                            enemy.body.collideWorldBounds = false;
                            enemy.reset(x, y);
                            enemy.health = health;
                            enemy.body.velocity.x = velX;
                            enemy.body.velocity.y = velY;
                            enemy.height = height;
                            enemy.width = width;
                            enemy.body.height = height;
                            enemy.body.width = width;
                        }
                        this.waveCounter += 1;
                        if (this.waveCounter < this.totalWaves) {
                            this.game.time.events.add(this.enemyWaves[this.waveCounter].waitTime * 1000, this.nextEnemyWave, this);
                        } else {
                            this.game.time.events.add(this.levelData.boss.waitTime * 1000, this.spawnBoss, this);
                        }
                    }
                },
                spawnBoss: function () {
                    if (!this.game.ending) {
                        var boss = this.boss.getFirstExists(false);
                        boss.resetBoss(this.levelData.boss.x, this.levelData.boss.y, this.levelData.boss.health);
                        this.enemies.add(boss);
                        this.boss = boss;
                    }
                },

                //  Player action and movement - begin
                makeVulnerable: function (player) {
                    //  TODO - show
                    player.invulnerable = false;
                },
                revivePlayer: function () {
                    if (!this.game.ending) {
                        var dead = this.players.getFirstDead();
                        if (dead !== null && angular.isDefined(dead)) {
                            dead.reset(0, 0);
                            dead.invulnerable = true;
                            //  TODO - sound, make invulnerable visible
                            this.game.time.events.add(this.PLAYER_INVULNERABLE_RATE, this.makeVulnerable, this, dead);

                            this.moveHelpers();
                        }
                        this.game.time.events.add(this.PLAYER_REVIVE_RATE, this.revivePlayer, this);
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
                                        default:
                                            console.log("ERROR!");
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
                            moved = true;
                        }
                        if (this.cursors.down.isDown) {
                            angular.forEach(this.players.children, function (player) {
                                player.y += this.PLAYER_MOVE_SPEED;
                            }, this);
                            moved = true;
                        }
                        if (this.cursors.left.isDown) {
                            angular.forEach(this.players.children, function (player) {
                                player.x -= this.PLAYER_MOVE_SPEED;
                            }, this);
                            moved = true;
                        }
                        if (this.cursors.right.isDown) {
                            angular.forEach(this.players.children, function (player) {
                                player.x += this.PLAYER_MOVE_SPEED;
                            }, this);
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
                                    default:
                                        console.log("ERROR2!");
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
                        var enemyType = enemy.name;
                        if (angular.isDefined(this.enemyGroups[enemyType])) {
                            this.enemyGroups[enemyType].add(enemy);
                        }
                        if (this.enemies.countLiving() === 0) {
                            if (this.waveCounter === this.totalWaves) {
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
                    deathTween.onComplete.add(function () {
                        //  TODO - retry move on option
                        this.game.state.start(this.state.current, true, false, this.level, this.startingArrows);
                    }, this);
                },

                winEnding: function () {
                    this.game.ending = true;
                    var winTween = this.game.add.tween(this);
                    winTween.to({PLAYER_LIGHT_RADIUS: 100}, 1000, Phaser.Easing.Power1, true);
                    winTween.onComplete.add(function () {
                        //  TODO - retry move on option
                        if ((this.level + 1) === Act3Settings.levelData.length) {
                            this.game.state.start('Interlude', true, false, 'Act3EndInterlude');
                        } else {
                            this.game.state.start(this.state.current, true, false, this.level + 1, this.arrowsRemaining + this.levelData.addArrowsAtEnd);
                        }
                    }, this);
                }
            };
        }
    ]
);
