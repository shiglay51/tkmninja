var Player = require('./Player');
var Const = require('./Const');
var Index = Const.Index;
var State = Const.State;
var Phase = Const.Phase;

var Game = function () { }

Game.suffle = function (source, mt) {
    var tmp = [];
    
    while (source.length > 0) { tmp.push(source.splice(mt.nextInt(source.length), 1)[0]); }
    
    while (tmp.length > 0) { source.push(tmp.splice(mt.nextInt(tmp.length), 1)[0]); }

    while (source.length > 0) { tmp.push(source.splice(mt.nextInt(source.length), 1)[0]); }

    while (tmp.length > 0) { source.push(tmp.splice(mt.nextInt(tmp.length), 1)[0]); }
}

Game.clear = function (game) {
    game.state = State.READY;
    game.sound = '';
    game.playerSize = 4;
    game.phase = Phase.NONE;
    game.active = Index.NONE;
    
    var playerList = game.playerList = [
          new Player()
        , new Player()
        , new Player()
        , new Player()
    ];

    var len1 = playerList.length;
    for (i = 0; i < len1; i++) { Player.clear(playerList[i]); }
}

Game.start = function (game, mt) {
    mt.setSeed((new Date()).getTime());
    game.state = State.PLAYING;
    game.phase = Phase.NONE;
    
    game.active = 0;

}

module.exports = Game;