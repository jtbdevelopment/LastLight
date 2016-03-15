'use strict';

angular.module('uiApp').factory('InterludeState',
    ['$timeout', 'Phaser', 'InterludeDictionary',
        function ($timeout, Phaser, InterludeDictionary) {
            var interlude = {
                game: undefined,
                load: undefined,
                data: undefined,
                state: undefined,

                DEBUG: false,

                FREQUENCY: 25,

                init: function (interlude) {
                    this.interlude = InterludeDictionary[interlude];
                    this.words = this.interlude.text.split(' ');
                    this.count = -1;
                    this.max = this.interlude.text.length;
                },

                create: function () {
                    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                    this.text = this.game.add.text(5, 5, "");
                    this.text.anchor.setTo(0.0);
                    this.text.font = 'Revalia';
                    this.text.fontSize = 12;
                    this.text.align = 'left';
                    this.text.stroke = '#000000';
                    this.text.strokeThickness = 5;
                    this.text.lineSpacing = 2;
                    this.text.wordWrap = true;
                    this.text.wordWrapWidth = 790;
                    var gradient = this.text.context.createLinearGradient(0, 0, 0, this.text.canvas.height);
                    gradient.addColorStop(0, '#FFD6AA');
                    gradient.addColorStop(1, '#FF9329');
                    this.text.fill = gradient;
                    this.game.input.keyboard.addCallbacks(this, undefined, undefined, this.moveOn);
                    this.game.input.onTap.add(this.moveOn, this);

                    this.continue = this.game.add.text(this.world.centerX, 320, "Click Or Press Any Key To Continue");
                    this.continue.anchor.setTo(0.5);
                    this.continue.font = 'Revalia';
                    this.continue.fontSize = 18;
                    this.continue.align = 'center';
                    this.continue.stroke = '#000000';
                    this.continue.strokeThickness = 5;
                    gradient = this.text.context.createLinearGradient(0, 320, 0, this.continue.canvas.height);
                    gradient.addColorStop(0, '#FFD6AA');
                    gradient.addColorStop(1, '#FF9329');
                    this.continue.fill = gradient;

                    $timeout(this.addWords, this.FREQUENCY, false, this);
                },

                update: function () {
                },

                addWords: function (state) {
                    state.count += 1;
                    if (state.count < state.max) {
                        state.text.text += state.interlude.text[state.count];
                        $timeout(state.addWords, state.FREQUENCY, false, state);
                    }
                },

                moveOn: function () {
                    this.interlude.moveOn(this.game);
                }
            };

            return interlude;
        }
    ]
);
