var Room = require('../Room');
var MersenneTwister = require('../MersenneTwister');
var Game = require('./Game');
var Player = require('./Player');
var Const = require('./Const');
var Index = Const.Index;
var Sound = Const.Sound;
var State = Const.State;
var Phase = Const.Phase;
var Card = Const.Card;
var CARD_SCORE = Const.CARD_SCORE;
var CARD_NAME = Const.CARD_NAME;
var FONT_COLOR = Const.FONT_COLOR;
var COLOR_NAME = Const.COLOR_NAME;

var Goipai = function () {
    this.initialize('g');

    this.game = new Game();
    this.mt = new MersenneTwister();

    Game.clear(this.game);
}

Goipai.prototype = new Room();

Goipai.prototype.split = function (source) {
    return source.slice(1).split(' ');
}

Goipai.prototype.reset = function () {
    this.isPlaying = false;

    Game.clear(this.game);

    this.broadcast(JSON.stringify(this.game));
}

Goipai.prototype.onCommand = function (user, message) {
    this.basicCommand(user, message);
}

Goipai.prototype.onChat = function (user, message) {
    var playerList = this.game.playerList;
    var color = 'white';

    var i;
    for (i = 0; i < playerList.length; i++) {
        if (playerList[i].uid === user.uid) {
            color = FONT_COLOR[i];
            break;
        }
    }

    this.chat(user.uid, color, (message.split('<').join('&lt;')).split('>').join('&gt;'));
}

Goipai.prototype.finish = function () {
    var game = this.game;
    var playerList = game.playerList;

    this.chat(
          '?'
        , 'deeppink'
        , '++勝利 おめでとう++'
    );

    if (game.score[0] >= 150) {
        this.chat(
              '?'
            , FONT_COLOR[0]
            , playerList[0].uid + '(' + COLOR_NAME[0] + ')'
        );
        this.chat(
              '?'
            , FONT_COLOR[2]
            , playerList[2].uid + '(' + COLOR_NAME[2] + ')'
        );
    } else {
        this.chat(
              '?'
            , FONT_COLOR[1]
            , playerList[1].uid + '(' + COLOR_NAME[1] + ')'
        );
        this.chat(
              '?'
            , FONT_COLOR[3]
            , playerList[3].uid + '(' + COLOR_NAME[3] + ')'
        );
    }


    game.active = Index.NONE;
    game.priority.length = 0;

    var i;
    for (i = 0; i < playerList.length; i++) {
        playerList[i].uid = '';
    }

    game.state = State.READY;
    this.isPlaying = false;
    game.sound = Sound.ENDING;
}

Goipai.prototype.deal = function (uid) {
    var game = this.game;
    game.phase = Phase.TRY;

    var priority = game.priority;
    priority.push(game.active);

    var playerList = game.playerList;
    var player;
    var max;

    var i;
    for (i = 0; i < playerList.length; i++) {
        player = playerList[i];

        switch (Player.countPown(player)) {
            case 5:
                if (game.phase === Phase.FIVE_POWN) {
                    player.peeping = true;

                    priority.length = 0;
                    priority.push(0);
                    priority.push(1);
                    priority.push(2);
                    priority.push(3);

                    game.score[i % 4] += 150;

                    this.chat('?', 'orange', '--手役--');
                    this.chat('?', FONT_COLOR[i], 'あがり「5し5し(150点)」');

                    game.phase = Phase.PAUSE;
                } else {
                    player.peeping = true;

                    priority.length = 0;
                    priority.push((i + 2) % 4);

                    game.phase = Phase.FIVE_POWN;
                }
                break;
            case 6:
                player.peeping = true;

                priority.length = 0;
                priority.push(0);
                priority.push(1);
                priority.push(2);
                priority.push(3);

                max = Player.maxScoreCard(player);

                game.score[i % 4] += CARD_SCORE[max];

                this.chat('?', 'orange', '--手役--');
                this.chat('?', FONT_COLOR[i], 'あがり「6し[' + CARD_NAME[max] + '](' + CARD_SCORE[max] + '点)」');

                game.phase = Phase.PAUSE;
                break;
            case 7:
                player.peeping = true;

                priority.length = 0;
                priority.push(0);
                priority.push(1);
                priority.push(2);
                priority.push(3);

                max = Player.maxScoreCard(player);

                game.score[i % 4] += CARD_SCORE[max] * 2;

                this.chat('?', 'orange', '--手役--');
                this.chat('?', FONT_COLOR[i], 'あがり「7し[' + CARD_NAME[max] + '](' + (CARD_SCORE[max] * 2) + '点)」');

                game.phase = Phase.PAUSE;
                break;
            case 8:
                player.peeping = true;

                priority.length = 0;
                priority.push(0);
                priority.push(1);
                priority.push(2);
                priority.push(3);

                game.score[i % 4] += 100;

                this.chat('?', 'orange', '--手役--');
                this.chat('?', FONT_COLOR[i], 'あがり「8し(100点)」');

                game.phase = Phase.PAUSE;
                break;
        }
    }

    var score = game.score;

    if (score[0] >= 150 || score[1] >= 150) {
        this.finish();
    } else {
        if (game.phase === Phase.TRY) {
            this.chat(
                '?'
                , 'orange'
                , '--「' + playerList[priority[0]].uid + '(' + COLOR_NAME[priority[0]] + ')」ターン--'
            );
        } else if (game.phase === Phase.FIVE_POWN) {
            this.chat(
                '?'
                , 'orange'
                , '--「5し」--'
            );
        }
    }
}

Goipai.prototype.onMessage = function (uid, message) {
    if (message[0] === 'a') {
        this.unicast(uid, JSON.stringify(this.game));
    } else {
        if (this.game.state === State.READY) {
            switch (message[0]) {
                case 'b':
                    (function (that) {
                        var game = that.game;
                        var playerList = game.playerList;

                        var player;
                        var isJoined = false;

                        var i;
                        for (i = 0; i < playerList.length; i++) {
                            player = playerList[i];

                            if (player.uid === uid) {
                                isJoined = true;
                                break;
                            }
                        }

                        if (!isJoined) {
                            for (i = 0; i < playerList.length; i++) {
                                player = playerList[i];

                                if (player.uid === '') {
                                    player.uid = uid;
                                    game.sound = Sound.JOIN;
                                    break;
                                }
                            }
                        }
                    })(this);
                    break;
                case 'c':
                    (function (that) {
                        var playerList = that.game.playerList;

                        var i;
                        for (i = 0; i < playerList.length; i++) {
                            var player = playerList[i];

                            if (player.uid === uid) {
                                player.uid = '';
                            }
                        }
                    })(this);
                    break;
                case 'd':
                    (function (that) {
                        var game = that.game;
                        var playerList = game.playerList;

                        if (
                               playerList[0].uid !== ''
                            && playerList[1].uid !== ''
                            && playerList[2].uid !== ''
                            && playerList[3].uid !== ''
                        ) {
                            var mt = that.mt;

                            Game.start(game, mt);
                            Game.deal(game, mt);
                            that.deal(uid);

                            that.isPlaying = true;
                            game.sound = Sound.OPENING;
                        }
                    })(this);
                    break;
            }
        } else if (Game.hasPriorityUid(this.game, uid)) {
            switch (message[0]) {
                case 'e':
                    (function (that) {
                        var game = that.game;

                        if (game.phase === Phase.FIVE_POWN) {
                            var priority = game.priority;

                            that.chat('?', FONT_COLOR[priority[0]], '決定');

                            priority.length = 0;
                            priority.push(game.active);

                            that.chat(
                                  '?'
                                , 'orange'
                                , '--「' + game.playerList[priority[0]].uid + '(' + COLOR_NAME[priority[0]] + ')」ターン--'
                            );

                            game.phase = Phase.TRY;
                            game.sound = Sound.PASS;
                        }
                    })(this);
                    break;
                case 'f':
                    (function (that) {
                        var game = that.game;

                        if (game.phase === Phase.FIVE_POWN) {
                            that.chat('?', FONT_COLOR[game.priority[0]], '流局');

                            Game.deal(game, that.mt);
                            that.deal(game);

                            game.sound = Sound.DICE;
                        }
                    })(this);
                    break;
                    break;
                case 'g':
                    (function (that) {
                        var game = that.game;

                        if (game.phase === Phase.TRY) {
                            var index = parseInt(that.split(message)[0]);

                            var player = game.playerList[game.priority[0]];
                            var hand = player.hand;

                            player.defense.push(hand[index]);
                            player.hidden.push(true);
                            hand.splice(index, 1);

                            if (hand.length === 1) {
                                game.phase = Phase.FINALLY;
                            } else {
                                game.phase = Phase.THROW;
                            }

                            game.sound = Sound.BUILD;
                        }
                    })(this);
                    break;
                case 'h':
                    (function (that) {
                        var game = that.game;

                        if (game.phase === Phase.THROW) {
                            var index = parseInt(that.split(message)[0]);

                            var priority = game.priority;
                            var playerList = game.playerList;
                            var player = playerList[priority[0]];
                            var hand = player.hand;
                            var card = hand[index];

                            player.offense.push(card);
                            hand.splice(index, 1);

                            that.chat('?', FONT_COLOR[priority[0]], '攻め「' + CARD_NAME[card] + '」');

                            game.try = card;
                            priority[0] = (priority[0] + 1) % 4;

                            that.chat(
                                  '?'
                                , 'orange'
                                , '--「' + playerList[priority[0]].uid + '(' + COLOR_NAME[priority[0]] + ')」ターン--'
                            );

                            game.phase = Phase.CATCH;
                            game.sound = Sound.PASS;
                        }
                    })(this);
                    break;
                case 'i':
                    (function (that) {
                        var game = that.game;

                        if (game.phase === Phase.CATCH) {
                            var priority = game.priority;

                            that.chat('?', FONT_COLOR[priority[0]], 'パス');

                            priority[0] = (priority[0] + 1) % 4;

                            that.chat(
                                  '?'
                                , 'orange'
                                , '--「' + game.playerList[priority[0]].uid + '(' + COLOR_NAME[priority[0]] + ')」ターン--'
                            );

                            if (game.active === priority[0]) {
                                game.phase = Phase.TRY;
                            }

                            game.sound = Sound.PASS;
                        }
                    })(this);
                    break;
                case 'j':
                    (function (that) {
                        var game = that.game;

                        if (game.phase === Phase.CATCH) {
                            var index = parseInt(that.split(message)[0]);

                            var priority = game.priority;
                            var player = game.playerList[priority[0]];
                            var hand = player.hand;

                            player.defense.push(hand[index]);
                            player.hidden.push(false);
                            hand.splice(index, 1);

                            game.active = priority[0];

                            if (hand.length === 1) {
                                game.phase = Phase.FINALLY;
                            } else {
                                game.phase = Phase.THROW;
                            }

                            game.sound = Sound.BUILD;
                        }
                    })(this);
                    break;
                case 'k':
                    (function (that) {
                        var game = that.game;

                        if (game.phase === Phase.FINALLY) {
                            var priority = game.priority;
                            var player = game.playerList[priority[0]];
                            var hand = player.hand;
                            var card = hand[0];

                            player.offense.push(card);
                            hand.splice(0, 1);

                            var point = CARD_SCORE[card];
                            var defense = player.defense;
                            var hidden = defense[defense.length - 1];
                            var chat;

                            if (
                                   card === hidden
                                || (
                                          (card === Card.KING1 || card === Card.KING2)
                                       && (hidden === Card.KING1 || hidden === Card.KING2)
                                   )
                            ) {
                                point *= 2;
                                chat = 'あがり「' + CARD_NAME[card] + CARD_NAME[hidden] + '(' + point + '点)」';
                            } else {
                                chat = 'あがり「' + CARD_NAME[card] + '(' + point + '点)」';
                            }

                            that.chat('?', FONT_COLOR[priority[0]], chat);

                            var score = game.score;
                            var color = priority[0] % 4;

                            score[color] += point;

                            if (score[0] >= 150 || score[1] >= 150) {
                                that.finish();
                            } else {
                                priority.length = 0;

                                priority.push(0);
                                priority.push(1);
                                priority.push(2);
                                priority.push(3);

                                game.phase = Phase.PAUSE;
                                game.sound = Sound.GET;
                            }
                        }
                    })(this);
                    break;
                case 'l':
                    (function (that) {
                        var game = that.game;

                        if (game.phase === Phase.PAUSE) {
                            var playerList = game.playerList;
                            var priority = game.priority;

                            var i;
                            for (i = 0; i < priority.length; i++) {
                                if (playerList[priority[i]].uid === uid) {
                                    priority.splice(i, 1);
                                    break;
                                }
                            }

                            if (priority.length === 0) {
                                Game.deal(game, that.mt);
                                that.deal(game);
                                game.sound = Sound.DICE;
                            } else {
                                game.sound = Sound.BUILD;
                            }
                        }
                    })(this);
                    break;
            }
        }
    }

    this.broadcast(JSON.stringify(this.game));
    this.game.sound = '';
}

module.exports = Goipai;