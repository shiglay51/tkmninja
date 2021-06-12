var Room = require('../Room');
var MersenneTwister = require('../MersenneTwister');
var Game = require('./Game');
var Const = require('./Const');
var Option = Const.Option;
var State = Const.State;
var Phase = Const.Phase;
var Sound = Const.Sound;
var Index = Const.Index;
var FONT_COLOR = Const.FONT_COLOR;
var COLOR_NAME = Const.COLOR_NAME;

var Blacks = function () {
    this.initialize('c');
    
    this.game = new Game();
    this.mt = new MersenneTwister();
    
    Game.clear(this.game);
}

Blacks.prototype = new Room();

Blacks.prototype.split = function (source) {
    return source.slice(1).split(' ');
}

Blacks.prototype.reset = function () {
    this.isPlaying = false;

    Game.clear(this.game);

    this.broadcast(JSON.stringify(this.game));
}

Blacks.prototype.onCommand = function (user, message) {
    this.basicCommand(user, message);
}

Blacks.prototype.onChat = function (user, message) {
    var playerList = this.game.playerList;
    var color = 'white';
    
    var i;
    var len1 = playerList.length;
    for (i = 0; i < len1; i++) {
        if (playerList[i].uid === user.uid) {
            color = FONT_COLOR[i];
            break;
        }
    }
    
    this.chat(user.uid, color, (message.split('<').join('&lt;')).split('>').join('&gt;'));
}

Blacks.prototype.onMessage = function (uid, message) {
    if (message[0] === 'a') {
        this.unicast(uid, JSON.stringify(this.game));
    } else {
        if (this.game.state === State.READY) {
            switch (message[0]) {
                // join the game (着席押下時)
                case 'b':
                    (function (that) {
                        var game = that.game;
                        var playerList = game.playerList;

                        var i;
                        var len1 = playerList.length;
                        for (i = 0; i < len1; i++) {
                            var player = playerList[i];
                            
                            if (player.uid === '') {
                                player.uid = uid;
                                game.sound = Sound.JOIN;
                                break;
                            }
                        }
                    })(this);
                    break;
                // leave the game (離席押下時)
                case 'c':
                    (function (that) {
                        var playerList = that.game.playerList;

                        var i;
                        var len1 = playerList.length;
                        for (i = 0; i < len1; i++) {
                            var player = playerList[i];
                            
                            if (player.uid === uid) { player.uid = ''; }
                        }
                    })(this);
                    break;
                // start the game
                case 'd':
                    (function (that) {
                        var game = that.game;
                        var mt = that.mt;
                        var playerList = game.playerList;
                        
                        if (
                               playerList[0].uid !== ''
                            && playerList[1].uid !== ''
                            && playerList[2].uid !== ''
                        ) {
                            Game.start(game, mt);
                            Dice.clear(that.dice, mt);

                            var active = game.active;
                            
                            that.chat(
                                  '?'
                                , 'orange'
                                , '--「' + playerList[active].uid + '(' + COLOR_NAME[active] + ')」ターン--'
                            );
                            
                            that.isPlaying = true;
                            game.sound = Sound.OPENING;
                        }
                    })(this);
                    break;
            }
        } else {
            switch (message[0]) {
                case 'e':
                case 'f':
                case 'g':
                case 'h':
                case 'i':
                case 'j':
                case 'k':
                case 'l':
                case 'm':
                case 'n':
                case 'o':
                case 'p':
                case 'q':
                case 'r':
                case 's':
                case 't':
                case 'u':
                case 'N':
                case 'v':
                case 'w':
                case 'x':
                case 'O':
                case 'y':
                case 'z':
                case 'A':
                case 'B':
                case 'C':
                case 'D':
                case 'E':
                case 'F':
                case 'G':
                case 'H':
                case 'I':
                case 'J':
                case 'K':
                case 'L':
                case 'M':
                default:
                    break;
            }
        }
        
        this.broadcast(JSON.stringify(this.game));
        this.game.sound = '';
    }
}

module.exports = Blacks;