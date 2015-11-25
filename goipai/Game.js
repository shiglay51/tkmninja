var Player = require('./Player');
var Const = require('./Const');
var Index = Const.Index;
var Value = Const.Value;
var State = Const.State;
var Phase = Const.Phase;
var Card = Const.Card;

var Game = function () { }

Game.suffle = function (source, mt) {
    var tmp = [];

    while (source.length > 0) { tmp.push(source.splice(mt.nextInt(source.length), 1)[0]); }

    while (tmp.length > 0) { source.push(tmp.splice(mt.nextInt(tmp.length), 1)[0]); }

    while (source.length > 0) { tmp.push(source.splice(mt.nextInt(source.length), 1)[0]); }

    while (tmp.length > 0) { source.push(tmp.splice(mt.nextInt(tmp.length), 1)[0]); }
}

Game.hasPriorityUid = function (game, uid) {
    var playerList = game.playerList;
    var priority = game.priority;

    var i;
    var len1 = priority.length;
    for (i = 0; i < len1; i++) {
        if (playerList[priority[i]].uid === uid) { return true; }
    }

    return false;
}

Game.clear = function (game) {
    game.state = State.READY;
    game.sound = '';
    game.phase = Phase.NONE;
    game.active = Index.NONE;
    game.priority = [];
    game.try = Value.NONE;
    game.score = [0, 0];

    var playerList = game.playerList = [
          new Player()
        , new Player()
        , new Player()
        , new Player()
    ];

    var i;
    var len1 = playerList.length;
    for (i = 0; i < len1; i++) {
        Player.clear(playerList[i]);
    }
}

Game.start = function (game, mt)  {
    game.state = State.PLAYING;
    game.sound = '';
    game.score[0] = game.score[1] = 0;
    game.active = 0;
    game.priority.length = 0;
}

Game.deal = function (game, mt) {
    game.try = Value.NONE;
    game.priority.length = 0;

    var deck = [];
    var i;
    for (i = 0; i < 10; i++) {
        deck.push(Card.POWN);
    }
    for (i = 0; i < 4; i++) {
        deck.push(Card.LANCE);
    }
    for (i = 0; i < 4; i++) {
        deck.push(Card.KNIGHT);
    }
    for (i = 0; i < 4; i++) {
        deck.push(Card.SILVER);
    }
    for (i = 0; i < 4; i++) {
        deck.push(Card.GOLD);
    }
    for (i = 0; i < 2; i++) {
        deck.push(Card.BISHOP);
    }
    for (i = 0; i < 2; i++) {
        deck.push(Card.ROOK);
    }
    deck.push(Card.KING1);
    deck.push(Card.KING2);

    Game.suffle(deck, mt);

    var playerList = game.playerList;
    var len1 = playerList.length;
    for (i = 0; i < len1; i++) {
        Player.deal(playerList[i], deck);
    }
}

module.exports = Game;