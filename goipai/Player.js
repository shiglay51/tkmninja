var Const = require('./Const');
var Index = Const.Index;
var Card = Const.Card;
var CARD_SCORE = Const.CARD_SCORE;

var Player = function () { }

Player.clear = function (player) {
    player.uid = '';
    player.hand = [];
    player.defense = [];
    player.hidden = [];
    player.offense = [];
    player.peeping = false;
}

Player.deal = function (player, deck) {
    player.hand.length = 0;
    player.defense.length = 0;
    player.hidden.length = 0;
    player.offense.length = 0;
    player.peeping = false;

    var hand = player.hand;
    var i;
    for (i = 0; i < 8; i++) {
        hand.push(deck.shift());
    }
}

Player.countPown = function (player) {
    var hand = player.hand;

    var count = 0;
    var i;
    var len1 = hand.length;
    for (i = 0; i < len1; i++) {
        if (hand[i] === Card.POWN) {
            count++;
        }
    }

    return count;
}

Player.maxScoreCard = function (player) {
    var hand = player.hand;

    var max = -1;
    var i;
    var len1 = hand.length;
    for (i = 0; i < len1; i++) {
        if (CARD_SCORE[hand[i]] > CARD_SCORE[max]) {
            max = hand[i];
        }
    }

    return max;
}

module.exports = Player;