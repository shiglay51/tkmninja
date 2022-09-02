var Room = function () { }

Room.prototype.symbol = null;
Room.prototype.userList = null;
Room.prototype.owner = null;
Room.prototype.watchDogTimer = null;
Room.prototype.isAuth = null;
Room.prototype.chatCount = {};
Room.prototype.redis = null;
Room.prototype.roomId = null;

Room.prototype.initialize = function (symbol, roomId, redis) {
    this.symbol = symbol;
    this.userList = [];
    this.owner = null;
    this.isPlaying = false;
    this.chatCount = {};

    this.roomId = roomId
    this.redis = redis
}

Room.prototype.resetWatchDog = function () {
    // console.log('RESET WATCHDOG', this.roomId);
    if(this.watchDogTimer) {
        clearTimeout(this.watchDogTimer);
    }
    this.watchDogTimer = setTimeout(() => {
        this.owner = null;
        this._broadcast('G');
        // console.log('EXPIRE WATCHDOG', this.roomId);
    }, 1000 * 60 * 10 /* 10 min */);   
}

Room.prototype.resetChatCount = function(uid) {
    var user = this.userList.find(u => u.uid === uid);
    if(!user) {
        return;
    }
    if(!this.chatCount[uid] || this.chatCount[uid].count === 0) {
        this.chatCount[uid] = {
            count: 0,
            timer: null
        }
    }
    if(this.chatCount[uid].timer === null) {
        this.chatCount[uid].timer = setTimeout(() => {
            this.chatCount[uid].count = 0;
            this.chatCount[uid].timer = null;
            delete this.chatCount[uid];
        }, 5000);
    }
    this.chatCount[uid].count++;
}

Room.prototype.removeUser = function (user) {
    var i;
    var len1 = this.userList.length;
    for (i = 0; i < len1; i++) {
        if (this.userList[i].ws === user.ws) {
            this.userList.splice(i, 1);

            if (user.trip !== '') {
                this._broadcast('E' + user.uid + '%' + user.trip);
            } else {
                this._broadcast('E' + user.uid);
            }

            break;
        }
    }

    if (this.owner === user) {
        this._broadcast('G');
        this.owner = null;
    }
}

Room.prototype._unicast = function (user, message) {
    try {
        user.ws.send(message);
    } catch (e) {
        this.removeUser(user);
    }
}

Room.prototype.unicast = function (uid, message) {
    var user = null;

    var i;
    var len1 = this.userList.length;
    for (i = 0; i < len1; i++) {
        if (this.userList[i].uid === uid) {
            user = this.userList[i];
            break;
        }
    }

    if (user !== null) { this._unicast(user, 'I' + message); }
}

Room.prototype._broadcast = function (message) {
    var i;
    var len1 = this.userList.length;
    for (i = 0; i < len1; i++) { this._unicast(this.userList[i], message); }
}

Room.prototype.broadcast = function (message, resetWatchDog = true) {
    if(resetWatchDog) {
        this.resetWatchDog();
    }
    const msg = {
        isPlaying: this.isPlaying,
        game: JSON.parse(message)
    }
    this.saveGame(JSON.stringify(msg));
    this._broadcast('I' + message);
}

Room.prototype.saveGame = function (game) {
    this.redis.SET(`room-${this.roomId}`, game)
}

Room.prototype.chat = function (uid, color, message) {
    this.resetChatCount(uid);
    var user = this.userList.find(u => u.uid === uid);
    if(user && this.chatCount[uid] && this.chatCount[uid].count > 5) {
        this.removeUser(user);
        this.chat('?', 'deeppink', uid + 'を追放しました。');
    }

    if(message.length > 140) {
        message = message.substr(0, 140) + '…';
    }
    this._broadcast('H' + uid + ' ' + color + ' ' + message);
}

Room.prototype.mention = function (from, to, color, message) {

    if(from === to) {
        return;
    }
    this.resetChatCount(from);
    var user = this.userList.find(u => u.uid === from);
    if(user && this.chatCount[from] && this.chatCount[from].count > 5) {
        this.removeUser(user);
        this.chat('?', 'deeppink', uid + 'を追放しました。');
    }

    if(message.length > 140) {
        message = message.substr(0, 140) + '…';
    }

    var toUser = this.userList.find(u => u.uid === to);

    if(toUser) {
        this._unicast(toUser, 'H' + from + ' ' + color + ' ' + message);
        this._unicast(user, 'H' + from + ' ' + color + ' ' + message);
    }
}

Room.prototype.reset = function () { }

Room.prototype.onLoad = function () { }

Room.prototype.onMessage = function (uid, message) { }

Room.prototype.onCommand = function (user, message) {
    this.basicCommand(user, message);
}

Room.prototype.onSilentGrant = function (user) {
    if (this.owner === null) {
        this.owner = user;
        this._broadcast('F' + user.uid);
    }
}

Room.prototype.onChat = function (user, message) {
    this.chat(user.uid, 'white', (message.split('<').join('&lt;')).split('>').join('&gt;'));
}

Room.prototype.basicCommand = function (user, message) {
    switch (message[0]) {
        case '/grant':
            if (user.trip === process.env.ADMIN_TRIP) {
                this.owner = user;
                this._broadcast('F' + user.uid);
                this.resetWatchDog();
                this.chat('?', 'deeppink', user.uid + 'が管理者を取得しました。');
                return;
            }
            if (this.owner === null) {
                this.owner = user;
                this._broadcast('F' + user.uid);
                this.resetWatchDog();
                this.chat('?', 'deeppink', user.uid + 'が管理者を取得しました。');
            } else {
                this.chat('?', 'deeppink', '既に管理者が居ます。');
            }
            break;
        case '/revoke':
            if (this.owner !== null && this.owner === user) {
                this.owner = null;
                this._broadcast('G');

                this.chat('?', 'deeppink', user.uid + 'が管理者を辞退しました。');
            } else {
                this.chat('?', 'deeppink', '元から管理者ではありません。');
            }
            break;
        case '/reset':
            if (this.owner !== null && this.owner.uid === user.uid) {
                this.reset();

                this.chat('?', 'deeppink', 'コンテンツをリセットしました。');
            } else {
                this.chat('?', 'deeppink', '管理者でないためリセットできません。');
            }
            break;
        case '/kick':
            if (this.owner !== null && this.owner.uid === user.uid) {
                if (!message[1]) {
                    this.chat('?', 'deeppink', 'プレイヤー名を入力してください');  
                } else {
                    var uid = message[1];
                    var user = this.userList.find(u => u.uid === uid);

                    if(!user) {
                        this.chat('?', 'deeppink', uid + 'は存在しません。');
                        return;
                    }

                    if (user.trip === process.env.ADMIN_TRIP) {
                        this.chat('?', 'deeppink', 'ゲームマスターはキックできません。');
                        return;
                    }
                    this.removeUser(user);
                    this.chat('?', 'deeppink', uid + 'を追放しました。');
                }
            } else  {
                this.chat('?', 'deeppink', '管理者でないためキックできません。');
            }

            break;
    }
}

module.exports = Room;
