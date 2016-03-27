'use strict';

angular.module('uiApp').factory('Act2MazeState',
    ['Phaser', 'Act2Settings', 'HelpDisplay', 'TextFormatter', 'TiledCalculator', 'TiledDisplay',
        function (Phaser, Act2Settings, HelpDisplay, TextFormatter, TiledCalculator, TiledDisplay) {
            return {
                calculator: TiledCalculator,
                game: undefined,
                load: undefined,
                data: undefined,
                state: undefined,

                FIND_PATH_FREQUENCY: 500, // seconds in millis

                DEBUG: false,
                //  Phaser state functions - begin
                init: function (level, startingTorches) {
                    this.level = level;
                    this.levelData = Act2Settings.levelData[level];
                    this.currentTorches = startingTorches;
                    this.startingTorches = this.currentTorches;
                },
                preload: function () {
                    //  Note tile asset IDs do not match because 0 represents no tile
                    //  So in tiled - a tile will be asset id 535
                    //  In json file it will be 536
                    //  When remapping images from one to another you would need to say 536 -> 535
                    this.load.tilemap('tilemap', 'assets/tilemaps/act2level' + (this.level + 1) + '.json', null, Phaser.Tilemap.TILED_JSON);

                    //  TODO - actual art
                    //  TODO - physics for art
                    //  https://code.google.com/p/box2d-editor/
                    //  http://phaser.io/examples/v2/p2-physics/load-polygon-1
                    //  TODO - real boundary layer ?
                    //  TODO - music
                    this.load.spritesheet('hyptosis_tile-art-batch-1', 'images/hyptosis_tile-art-batch-1.png', 32, 32);
                    this.load.spritesheet('hyptosis_tile-art-batch-2', 'images/hyptosis_tile-art-batch-2.png', 32, 32);
                    this.load.spritesheet('hyptosis_tile-art-batch-3', 'images/hyptosis_tile-art-batch-3.png', 32, 32);
                    this.load.image('player', 'images/HB_Dwarf05.png');
                    this.load.image('demon', 'images/DemonMinorFighter.png');
                    this.load.image('people', 'images/PeopleFarmer.png');
                    this.load.image('logs', 'images/unlitbonfire.png');
                },
                create: function () {
                    this.game.resetDefaultSize();
                    this.playerLightRadius = Act2Settings.PLAYER_LIGHT_RADIUS;
                    this.demonMaxSight = Act2Settings.DEMON_SENSE_PLAYER_MAX_DISTANCE;
                    this.game.ending = false;

                    TiledDisplay.initializeTileMap(this, ['hyptosis_tile-art-batch-1', 'hyptosis_tile-art-batch-2', 'hyptosis_tile-art-batch-3']);
                    TiledDisplay.initializeEasyStar(this);

                    this.game.physics.startSystem(Phaser.Physics.P2JS);
                    this.game.physics.p2.convertTilemap(this.map, this.blockLayer);
                    this.game.physics.p2.setBoundsToWorld(true, true, true, true, false);
                    this.createEnemies();
                    this.createBonfires();
                    this.createPeople();
                    this.calculator.initializeWorldShadowing(this);
                    this.initializeInfoTracker();
                    this.createMaterials();
                    this.createPlayer();
                    this.initializeKeyboard();
                    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                    HelpDisplay.initializeHelp(this, Act2Settings.helpText, this.level === 0);
                    this.peopleText.text = this.makePeopleText();
                    this.bonfireText.text = this.makeBonfireText();
                },
                update: function () {
                    this.player.body.setZeroVelocity();
                    TiledDisplay.clearTileHitDisplay(this);
                    if (!this.game.ending) {
                        this.enemyGroup.forEach(function (enemy) {
                            try {
                                enemy.updateFunction();
                            } catch (ex) {
                                console.log(ex);
                            }
                            enemy.updateFunction();
                        });
                        this.peopleGroup.forEachAlive(function (person) {
                            try {
                                person.updateFunction();
                            } catch (ex) {
                                console.log(ex);
                            }
                        });
                        this.easyStar.calculate();
                        this.handlePlayerMovement();
                    } else {
                        this.enemyGroup.forEach(function (enemy) {
                            enemy.body.setZeroVelocity();
                        });
                        this.peopleGroup.forEachAlive(function (person) {
                            person.body.setZeroVelocity();
                        });
                    }
                    TiledDisplay.showTileHitsDisplay(this);
                    this.updateWorldShadowAndLights();
                },
                render: function () {
                    if (this.DEBUG) {
                        this.game.debug.cameraInfo(this.game.camera, 0, 100);
                        this.game.debug.spriteInfo(this.player, 400, 100);
                    }
                },
                //  Phaser state functions - end

                //  Creation functions - begin
                createMaterials: function () {
                    this.playerMaterial = this.game.physics.p2.createMaterial('playerMaterial');
                    this.peopleMaterial = this.game.physics.p2.createMaterial('peopleMaterial');
                    this.worldMaterial = this.game.physics.p2.createMaterial('worldMaterial');
                    this.bonfireMaterial = this.game.physics.p2.createMaterial('bonfireMaterial');
                    this.enemyMaterial = this.game.physics.p2.createMaterial('enemyMaterial');

                    this.game.physics.p2.setWorldMaterial(this.worldMaterial, true, true, true, true);

                    this.game.physics.p2.createContactMaterial(this.playerMaterial, this.worldMaterial, {
                        friction: 0.01,
                        restitution: 1,
                        stiffness: 0
                    });
                    this.game.physics.p2.createContactMaterial(this.playerMaterial, this.bonfireMaterial, {
                        friction: 0,
                        restitution: 1,
                        stiffness: 0,
                        relaxation: 0,
                        frictionStiffness: 0,
                        frictionRelaxation: 0,
                        surfaceVelocity: 0
                    });
                    this.game.physics.p2.createContactMaterial(this.playerMaterial, this.peopleMaterial, {
                        friction: 1,
                        restitution: 0,
                        surfaceVelocity: 10
                    });
                    this.game.physics.p2.createContactMaterial(this.enemyMaterial, this.worldMaterial, {
                        friction: 0,
                        restitution: 1,
                        stiffness: 0,
                        relaxation: 0,
                        frictionStiffness: 0,
                        frictionRelaxation: 0,
                        surfaceVelocity: 0
                    });
                    this.game.physics.p2.createContactMaterial(this.enemyMaterial, this.bonfireMaterial, {
                        friction: 0,
                        restitution: 1,
                        stiffness: 0,
                        relaxation: 0,
                        frictionStiffness: 0,
                        frictionRelaxation: 0,
                        surfaceVelocity: 0
                    });
                    this.game.physics.p2.createContactMaterial(this.peopleMaterial, this.bonfireMaterial, {
                        friction: 0,
                        restitution: 1,
                        stiffness: 0,
                        relaxation: 0,
                        frictionStiffness: 0,
                        frictionRelaxation: 0,
                        surfaceVelocity: 0
                    });
                },
                createPlayer: function () {
                    this.playerGroup = this.game.add.group();
                    this.player = this.game.add.sprite(this.levelData.startingX, this.levelData.startingY, 'player');
                    this.game.physics.p2.enable(this.player);
                    this.player.body.collideWorldBounds = true;
                    this.player.body.fixedRotation = true;
                    this.player.body.debug = this.DEBUG;
                    this.player.body.setMaterial(this.playerMaterial);
                    this.player.height = 20;
                    this.player.width = 20;
                    this.player.body.setCircle(10);
                    this.player.body.mass = Act2Settings.PLAYER_MASS;
                    this.game.camera.follow(this.player);
                    this.player.body.onBeginContact.add(this.playerCollisionCheck, this);
                    this.playerGroup.add(this.player);
                },

                createPeople: function () {
                    this.peopleGroup = this.game.add.physicsGroup(Phaser.Physics.P2JS);
                    this.map.createFromObjects('Object Layer', 1867, 'people', 0, true, false, this.peopleGroup, this.levelData.townPersonClass, false);
                    this.peopleGroup.forEach(function (person) {
                        person.state = this;
                        person.settings = Act2Settings;
                        person.body.setMaterial(this.peopleMaterial);
                        person.height = 20;
                        person.width = 20;
                        person.body.mass = Act2Settings.PEOPLE_MASS;
                        person.reset(person.x + 16, person.y - 16);
                        person.body.onBeginContact.add(this.personCollisionCheck, this);
                    }, this);
                },

                createBonfires: function () {
                    this.bonfireGroup = this.game.add.physicsGroup(Phaser.Physics.P2JS);
                    this.map.createFromObjects('Object Layer', 964, 'logs', 0, true, false, this.bonfireGroup);
                    this.bonfireGroup.forEach(function (fire) {
                        fire.state = this;
                        fire.settings = Act2Settings;
                        fire.lit = false;
                        fire.reset(fire.x + 16, fire.y + 16);
                        //  TODO - make it so player hitting people stops player
                        fire.body.setMaterial(this.bonfireMaterial);
                        fire.body.mass = Act2Settings.BONFIRE_MASS;
                        fire.body.debug = this.DEBUG;
                        fire.body.setZeroDamping();
                    }, this);
                },

                createEnemies: function () {
                    this.enemyGroup = this.game.add.physicsGroup(Phaser.Physics.P2JS);
                    this.map.createFromObjects('Object Layer', 782, 'demon', 0, true, false, this.enemyGroup, this.levelData.patrolEnemyClass, false);
                    this.enemyGroup.forEach(function (enemy) {
                        enemy.state = this;
                        enemy.settings = Act2Settings;
                        enemy.body.setMaterial(this.enemyMaterial);
                        enemy.stunTime = 0;
                        enemy.height = 20;
                        enemy.width = 20;
                        enemy.reset(enemy.x + 16, enemy.y - 16);
                    }, this);
                },

                initializeKeyboard: function () {
                    this.cursors = this.game.input.keyboard.createCursorKeys();
                    this.stunKey = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
                    this.stunKey.onUp.add(this.useStunMove, this);
                },

                initializeInfoTracker: function () {
                    this.torchText = this.game.add.text(0, 0, this.makeTorchText());
                    TextFormatter.formatTracker(this.torchText);
                    this.peopleText = this.game.add.text(0, 0, '');
                    TextFormatter.formatTracker(this.peopleText);
                    this.peopleText.cameraOffset.setTo(3, 15);
                    this.bonfireText = this.game.add.text(0, 0, '');
                    TextFormatter.formatTracker(this.bonfireText);
                    this.bonfireText.cameraOffset.setTo(3, 30);
                },
                //  Creation functions - end

                //  help text - end

                //  Torch related - begin
                makeTorchText: function () {
                    return 'Torches: ' + this.currentTorches;
                },

                //  Torch related - begin
                makeBonfireText: function () {
                    return 'Bonfires: ' +
                        this.bonfireGroup.filter(function (fire) {
                            return fire.lit;
                        }, true).total +
                        ' lit, ' +
                        this.bonfireGroup.filter(function (fire) {
                            return !fire.lit;
                        }, true).total +
                        ' unlit';
                },

                makePeopleText: function () {
                    //  TODO
                    return 'People: ' + this.peopleGroup.countLiving() + ' left, ' + this.peopleGroup.countDead() + ' killed';
                },

                updateWorldShadowAndLights: function () {
                    this.calculator.updateShadows(this);
                    this.calculator.drawCircleOfLight(this, this.player, this.playerLightRadius);
                    this.bonfireGroup.forEachAlive(function (fire) {
                        if (fire.lit) {
                            this.calculator.drawCircleOfLight(this, fire, Act2Settings.BONFIRE_LIGHT_DISTANCE);
                        }
                    }, this);
                },
                //  Torch related -end
                checkIfEnoughTorchesRemain: function () {
                    var torchesNeeded = Act2Settings.TORCHES_TO_LIGHT_BONFIRE * this.bonfireGroup.filter(function (fire) {
                            return !fire.lit;
                        }, true).total;
                    if (this.currentTorches < torchesNeeded) {
                        this.deathEnding();
                    }
                },

                //  Player action and movement - begin
                playerCollisionCheck: function (body) {
                    if (angular.isDefined(body) &&
                        body !== null &&
                        angular.isDefined(body.sprite) &&
                        body.sprite !== null &&
                        angular.isDefined(body.sprite.key)) {
                        switch (body.sprite.parent) {
                            case this.enemyGroup:
                                this.deathEnding();
                                break;
                            case this.bonfireGroup:
                                if (!body.sprite.lit && this.currentTorches >= Act2Settings.TORCHES_TO_LIGHT_BONFIRE) {
                                    this.currentTorches -= Act2Settings.TORCHES_TO_LIGHT_BONFIRE;
                                    body.sprite.lit = true;
                                    this.torchText.text = this.makeTorchText();
                                    this.bonfireText.text = this.makeBonfireText();
                                    this.enemyGroup.forEachAlive(function (enemy) {
                                        if (this.calculator.calcDistanceBetweenSprites(body.sprite, enemy).distance <= Act2Settings.BONFIRE_LIGHT_DISTANCE) {
                                            enemy.kill();
                                        }
                                    }, this);
                                    if (this.bonfireGroup.checkAll('lit', true)) {
                                        this.winEnding();
                                    } else {
                                        this.checkIfEnoughTorchesRemain();
                                    }
                                    //  TODO - change image to lit
                                    //  TODO - mark easy star grid tiles as off limits

                                }
                                break;
                        }
                    }
                },

                personCollisionCheck: function (body) {
                    if (angular.isDefined(body) &&
                        body !== null &&
                        angular.isDefined(body.sprite) &&
                        body.sprite !== null &&
                        angular.isDefined(body.sprite.key)) {
                        switch (body.sprite.parent) {
                            case this.enemyGroup:
                                body.sprite.kill();
                                break;
                            case this.bonfireGroup:
                                if (body.sprite.lit) {
                                    body.sprite.safe = true;
                                    body.setZeroVelocity();
                                }
                                break;
                        }
                    }
                },

                useStunMove: function () {
                    this.enemyGroup.forEachAlive(function (enemy) {
                        if (this.calculator.calcDistanceBetweenSprites(this.player, enemy).distance <= Act2Settings.STUN_DISTANCE) {
                            enemy.stunTime = this.game.time.now + Act2Settings.STUN_DURATION;
                            enemy.stunned = true;
                            enemy.body.setZeroVelocity();
                        }
                    }, this);
                    this.currentTorches -= 1;
                    this.checkIfEnoughTorchesRemain();
                },

                handlePlayerMovement: function () {
                    if (this.cursors.up.isDown) {
                        this.player.body.moveUp(Act2Settings.PLAYER_MOVE_SPEED);
                    }
                    if (this.cursors.down.isDown) {
                        this.player.body.moveDown(Act2Settings.PLAYER_MOVE_SPEED);
                    }
                    if (this.cursors.left.isDown) {
                        this.player.body.moveLeft(Act2Settings.PLAYER_MOVE_SPEED);
                    }
                    if (this.cursors.right.isDown) {
                        this.player.body.moveRight(Act2Settings.PLAYER_MOVE_SPEED);
                    }
                },
                //  Player action and movement - end

                //  Ending related
                deathEnding: function () {
                    this.game.ending = true;
                    var deathTween = this.game.add.tween(this);
                    deathTween.to({playerLightRadius: 0}, 1000, Phaser.Easing.Power1, true);
                    deathTween.onComplete.add(function () {
                        //  TODO - dying off screen doesn't reset cleanly without move
                        this.player.x = this.levelData.startingX;
                        this.player.y = this.levelData.startingY;
                        this.player.kill();
                        //  TODO - retry move on option
                        this.game.state.start(this.state.current, true, false, this.level, this.startingTorches);
                    }, this);
                },

                winEnding: function () {
                    this.game.ending = true;
                    var winTween = this.game.add.tween(this);
                    winTween.to({playerLightRadius: 100}, 1000, Phaser.Easing.Power1, true);
                    winTween.onComplete.add(function () {
                        //  TODO - retry move on option
                        if ((this.level + 1) === Act2Settings.levelData.length) {
                            this.game.state.start('Interlude', true, false, 'Act2EndInterlude');
                        } else {
                            this.game.state.start(this.state.current, true, false, this.level + 1, this.currentTorches);
                        }
                    }, this);
                }

            };
        }
    ]
);
