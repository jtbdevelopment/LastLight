'use strict';

angular.module('uiApp').factory('InterludeDictionary',
    [
        function () {
            return {
                StartInterlude: {
                    text: "Darkness and chaos have come with some foul magic.\n" +
                    "Yesterday mid-day, the sky suddenly grew dark and thick with fog and the light barely shines through. " +
                    "Worse, no hearth, campfire, candle or torch remains alight, and no tinder or match seems to be able to catch.  " +
                    "This morning the grim fog continues and again the light of the sun is a pale flicker. The plants are already beginning to wilt, " +
                    "and the crops, animals and people will perish if this continues much longer.\n" +
                    "Finally, dark demonic shadows hunt in this unnatural twilight, and their touch is death.\n\n" +
                    "You are skilled woodsman and hunter, just returning to town with supplies when this befell and you saw friends and neighbors killed.  " +
                    "Helpless, you were able to escape back to the woods and now seek to find some place safe til this passes ... or the end comes.",
                    moveOn: function (game) {
                        game.state.start('Act1', true, false, 0, 0);
                    }
                }
            };
        }
    ]);
