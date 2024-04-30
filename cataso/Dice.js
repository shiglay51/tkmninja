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
    for(i = 0; i < 10; i++) {
        var j;
        for(j = 2; j <= 6; j++) {
            dice.reel.push(j);
        }
    }

    Game.suffle(dice.reel, dice.mt);
}

Dice.roll = function(dice) {
    if(dice.seek > dice.reel.length / 2) { this.reset(dice); }

    dice.first = dice.reel[dice.seek];
    dice.seccond = dice.reel[dice.reel.length - (dice.seek + 1)];

    var v1s = [1];
    dice.first = v1s[0];
    
    var n = dice.reel[dice.seek];
    //         0,  1, 2  3  4  5  6  7  8  9 10 11 12    
    var v1s = [-1,-1, 1, 1, 3, 3, 5, 2, 5, 4, 4, 5, 6];
    var v2s = [-1,-1, 1, 2, 1, 2, 1, 5, 3, 5, 6, 6, 6];
    
    //dice.first = v1s[n];
    //dice.second = v2s[n];
        
    dice.seek++;
}


module.exports = Dice;
