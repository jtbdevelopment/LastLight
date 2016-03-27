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
                },
                FoundCandlesInterlude: {
                    text: "Wonder of wonders!\nBuried in this old manor, is a fallen candelabra with 20 lit candles!  Somehow these have escaped the darkness, " +
                    "and you test that if you put one out, you can relight it from the others, though you cannot seem to light anything else.\n" +
                    "You know you must bring these to the Council of Magi as fast as possible to see if the last flickers of salvation are in " +
                    "your hands.  You will need to move quickly before you run out of candles, and your ability to hide from the demons will be " +
                    "reduced.\n\n" +
                    "Hopefully they will be able to find a way to end the unnatural night.  Hopefully they still live...",
                    moveOn: function (game) {
                        game.state.start('Act1', true, false, 2, 20);
                    }
                },
                Act1EndInterlude: {
                    text: "You made it to the council and they still fight, despite any success ere now!\n\n" +
                    "When they see what you bring, new hope surges within their eyes.  With powerful cleansing spells they are able to get torches to stay lit, " +
                    "and from one torch they can light others.  No other match or tinder continues to spark, but any lit initially from your candles burns true and they are able " +
                    "to light their hall and gather in council to discuss how to best move forward.\n\n" +
                    "Soon they venture out with several torches until they find a demon.  It skitters away from the light avoiding it, but the Magi " +
                    "find if they can make enough light, they can stun it and if they can touch it with enough flame it screeches in pain and dissolves.\n\n" +
                    "With this knowledge, they ask if you can try to save as many people as possible, bringing them cleansed torches to towns and villages to " +
                    "light bonfires to hold back the night while they plan the next steps.\n",
                    moveOn: function (game) {
                        game.state.start('Act2', true, false, 0, 100);
                    }
                },
                Act2EndInterlude: {
                    text: "The Council thanks you for your help saving as many people as possible.  They ask for your help one more time.\n\n" +
                    "They believe they have found a way to turn the tide.  An old series of towers used to string the mountains, and used fire and lenses to " +
                    "signal from one to another.  They fell into disuse but their is one still nearby.  If it's lens is still there, they think they can " +
                    "make a weapon of it to defeat the dark and the demons.\n\n" +
                    "But first, you must get to the tower, and many demons stand between you and it.  The Magi have armed you with flammable arrows, " +
                    "but fire carefully, as they were only able to cleanse so many in the time.  Some of the people you saved will fight with you as you go.",
                    moveOn: function (game) {
                        game.state.start('Act3', true, false, 0, 1000);
                    }
                },
                Act3EndInterlude: {
                    text: "You have reached the Tower and the great signal lens of the remains intact!  The tower remains well stocked from the pass with firewood and " +
                    "soon a great fire is lit.  The lens' housing is stiff with age, but with effort you are able to get it to shift again.\n\n" +
                    "Soon, according to the Magi, " +
                    "the sun will begin to rise, and you will be able to make it out faintly in the east.  By focusing the lens on it, the Council hopes to " +
                    "burn away the fog from both sides at its weakest point.\n\n" +
                    "When the demons sense what is happening they are sure to try to stop you.  Below you can hear the people and see the faint light of their torches patrolling the area, protecting the tower.  " +
                    "They will hold them off as long as possible.  The Magi also suggest you may use the lens to easily destroy the demons, but be wary, " +
                    "the heat it generates is powerful and will slay friend or foe alike.",
                    moveOn: function (game) {
                        game.state.start('Act4', true, false);
                    }
                },
                Act4EndInterlude: {
                    text: "You have done it!  With the last hints of fog burned away from the sun, its rays break down across the world.\n\n" +
                    "Demons wither in the light burning away to nothing.  Some escape in shadow and quickly return to wherever they came from. " +
                    "blah blah blah",
                    moveOn: function (game) {
                        game.state.start('TitleScreen', true, false);
                    }
                }
            };
        }
    ]);
