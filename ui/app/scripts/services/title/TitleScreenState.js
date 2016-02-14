'use strict';

angular.module('uiApp').factory('TitleScreenState',
    ['$timeout', 'Phaser',
        function ($timeout, Phaser) {
            var titleScreen = {
                game: undefined,
                load: undefined,
                data: undefined,
                state: undefined,

                DEBUG: false,

                preload: function () {
                },

                create: function () {
                    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                    //  TODO
                    //this.game.state.start('Act1', true, false, 0, 0);
                    this.titleText = this.game.add.text(this.world.centerX, this.world.centerY, "Last Light");
                    this.titleText.anchor.setTo(0.5);
                    this.titleText.font = 'Revalia';
                    this.titleText.fontSize = 80;
                    this.titleText.align = 'center';
                    this.titleText.stroke = '#000000';
                    this.titleText.strokeThickness = 5;
                    var gradient = this.titleText.context.createLinearGradient(0, 0, 0, this.titleText.canvas.height * 2);
                    gradient.addColorStop(0, '#FFD6AA');
                    gradient.addColorStop(1, '#FF9329');
                    this.titleText.fill = gradient;
                    this.shadowTexture = this.game.add.bitmapData(this.game.world.width, this.game.world.height);
                    this.lightSprite = this.game.add.image(this.game.camera.x, this.game.camera.y, this.shadowTexture);
                    this.lightSprite.blendMode = Phaser.blendModes.MULTIPLY;

                    this.shadowTexture.context.fillStyle = 'rgb(10, 10, 10)';
                    this.shadowTexture.context.fillRect(0, 0, this.game.world.width, this.game.world.height);
                    this.lightRadius = 500;
                },

                update: function () {
                    if (this.lightRadius > 12) {
                        this.lightRadius -= 1;
                    } else {

                    }
                    this.shadowTexture.context.fillStyle = 'rgb(10, 10, 10)';
                    this.shadowTexture.context.fillRect(0, 0, this.game.world.width, this.game.world.height);
                    var x = this.world.centerX + 81;
                    var y = this.world.centerY - 24;
                    var radius = this.lightRadius + this.game.rnd.integerInRange(1, 10);
                    var gradient = this.shadowTexture.context.createRadialGradient(
                        x, y, this.lightRadius * 0.25,
                        x, y, radius);
                    gradient.addColorStop(0, 'rgba(225, 225, 225, 1.0)');
                    gradient.addColorStop(1, 'rgba(225, 225, 225, 0.0)');

                    this.shadowTexture.context.beginPath();
                    this.shadowTexture.context.fillStyle = gradient;
                    this.shadowTexture.context.arc(x, y, radius, 0, Math.PI * 2, false);
                    this.shadowTexture.context.fill();
                    this.shadowTexture.dirty = true;

                }
            };

            return titleScreen;
        }
    ]
);
