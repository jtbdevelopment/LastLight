'use strict';

angular.module('uiApp').factory('InterludeState',
    ['$timeout', 'Phaser', 'InterludeDictionary', 'TextFormatter',
        function ($timeout, Phaser, InterludeDictionary, TextFormatter) {
            var interlude = {
                game: undefined,
                load: undefined,
                data: undefined,
                state: undefined,

                DEBUG: false,

                FREQUENCY: 25,

                init: function (interlude) {
                    this.interlude = InterludeDictionary[interlude];
                    this.count = -1;
                    this.max = this.interlude.text.length;
                },

                create: function () {
                    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
                    this.text = this.game.add.text(5, 5, "");
                    TextFormatter.formatText(this.text);
                    this.text.wordWrap = true;
                    this.text.wordWrapWidth = 790;
                    this.game.input.keyboard.addCallbacks(this, undefined, undefined, this.moveOn);
                    this.game.input.onTap.add(this.moveOn, this);

                    this.continue = this.game.add.text(this.world.centerX, 320, "Click Or Press Any Key To Continue");
                    TextFormatter.formatText(this.continue);
                    this.continue.anchor.setTo(0.5);
                    this.continue.fontSize = 18;

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
