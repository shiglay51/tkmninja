var Game = require('./Game');

var Dice = function () { }

Dice.clear = function(dice, mt) {
    dice.first = 0;
    dice.seccond = 0;
    dice.seek = 0;
    dice.reel = [];
    dice.mt = mt;

    this.reset(dice);
}

Dice.reset = function(dice) {
    dice.seek = 0;
    dice.reel.length = 0;

    var i;
    for(i = 0; i < 3; i++) {
        var j;
        var k;
        for(j = 1; j <= 6; j++) {
            for(k = 1; k <= 6; k++) {
                dice.reel.push(j+k);
            }
        }
    }

    Game.suffle(dice.reel, dice.mt);
}

Dice.roll = function(dice) {
    if(dice.seek > dice.reel.length / 2) { this.reset(dice); }

    var v1s = [-1,-1, 1, 1, 3, 3, 5, 2, 5, 4, 4, 5, 6];
    var v2s = [-1,-1, 1, 2, 1, 2, 1, 5, 3, 5, 6, 6, 6];
    
    var n = dice.reel[dice.seek];
    dice.first = v1s[n];
    dice.second = v2s[n];
    
    dice.seek++;
}


module.exports = Dice;
