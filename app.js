var WebSocketServer = require('ws').Server;
var http = require('http');
var server = http.createServer();
var crypto = require('crypto');
var MersenneTwister = require('./MersenneTwister');
var Cataso = require('./cataso/Cataso');
var Kcataso = require('./kcataso/Kcataso');
var BattleRaiso = require('./battleraiso/BattleRaiso');
var Goipai = require('./goipai/Goipai');
var Blocas = require('./blocas/Blocas');

var roomList = [
      new Cataso()               // 0
    , new Cataso()               
    , new Cataso()               
    , new BattleRaiso()               
    , new Goipai()
    , new Cataso()
    , new Cataso()
    , new Cataso()
    , new Cataso()
    , new Cataso()
    , new Cataso()                 // 10
    , new Cataso()
    , new Cataso()
    , new Cataso()
    , new Cataso()
    , new Cataso()
    , new Cataso()
    , new Cataso()
    , new Cataso()
    , new Cataso()
    , new BattleRaiso()            // 20
    , new BattleRaiso()
    , new BattleRaiso()
    , new Goipai()
    , new Goipai()
    , new Cataso()
    , new Kcataso()
    , new Kcataso()
    , new Kcataso()
    , new Kcataso()
    , new Kcataso()                 // 30
    , new Blocas()                 
    , new Blocas()                 
    , new Blocas()                 
    , new Blocas()                 
    , new Blocas()                 
    // isAuth
    , new Cataso(true)              // 36
    , new Cataso(true)
    , new Cataso(true)
    , new Cataso(true)
    , new Cataso(true)             // 40
    , new BattleRaiso(true)        // 41
    , new BattleRaiso(true)     
    , new BattleRaiso(true)     
    , new BattleRaiso(true)     
    , new BattleRaiso(true)
    , new Goipai(true)             // 46
    , new Goipai(true)
    , new Goipai(true)
    , new Goipai(true)
    , new Goipai(true)
    , new Kcataso(true)          // 51
    , new Kcataso(true)
    , new Kcataso(true)
    , new Kcataso(true)
    , new Kcataso(true)
    , new Blocas(true)          // 56
    , new Blocas(true)     
    , new Blocas(true)     
    , new Blocas(true)     
    , new Blocas(true)         // 60

];

var User = function (ws, uid, trip) {
    this.ws = ws;
    this.uid = uid;
    this.trip = trip;
}

var splitSyntaxType1 = function (source) {
    return source.substring(1);
}

var sendUserList = function (index, ws) {
    var buff = '';

    var i;
    var len1 = roomList[index].userList.length;
    for (i = 0; i < len1; i++) {
        if (i > 0) { buff += ' '; }

        if (roomList[index].userList[i].trip !== '') {
            buff += roomList[index].userList[i].uid + '%' + roomList[index].userList[i].trip;
        } else {
            buff += roomList[index].userList[i].uid;
        }
    }

    try {
        ws.send('A' + buff);
    } catch (e) { }
}

var createTrip = function (source) {
    while (source.length < 8) { source += 'H'; }

    var cipher = crypto.createCipher('des-ecb', source.substr(0, 3));
    var crypted = cipher.update(source.substr(0, 8), 'utf-8', 'hex');
    crypted += cipher.final('hex');
    
    return crypted.substr(0, 10);
}

var auth = function (index, trip) {
    if(!roomList[index].isAuth) return true;
    if(trip == '') return false;

    var owner = roomList[index].userList.filter(user => user === roomList[index].owner);
    if(owner.length === 0) {
        return true;
    } else  {
        if(owner[0].trip == '') {
            return true;
        }
        if(owner[0].trip === trip) {
            return true;
        }
        return false;
    }
}

var login = function (index, ws, message) {
    var isSuccessful = false;

    var token = splitSyntaxType1( message).split('#', 2);
    var uid = token[0];

    var src;
    if (token.length > 1) { src = token[1]; }

    var trip = '';
    if (src) { trip = createTrip(src); }
    
    if (
           uid.length > 0
        && uid.match(/^[0-9A-Za-z]{1,12}$/)
        && auth(index, trip)
    ) {
        isSuccessful = true;

        var i;
        var len1 = roomList[index].userList.length;
        for (i = 0; i < len1; i++) {
            if (uid === roomList[index].userList[i].uid) {
                isSuccessful = false;
                break;
            }
        }

    }

    if (isSuccessful) {
        try {

            if (trip !== '') {
                ws.send('B' + uid + '%' + trip);
            } else {
                ws.send('B' + uid);
            }

            sendUserList(index, ws);

            var user = new User(ws, uid, trip);
            roomList[index].userList.push(user);
            
            if (user.trip !== '') {
                roomList[index]._broadcast('D' + user.uid + '%' + user.trip);
            } else {
                roomList[index]._broadcast('D' + user.uid);
            }

            if (roomList[index].owner !== null) {
                ws.send('F' + roomList[index].owner.uid);
            }
        } catch (e) {
        }
    } else {
        try {
            ws.send('C');
        } catch (e) { }
    }
}

var wss = new WebSocketServer({server:server});

wss.on('connection', function (ws) {
    ws.on('close', function () {
        var user = null;

        var i;
        var len1 = roomList.length;
        for (i = 0; i < len1; i++) {
            var j;
            var len2 = roomList[i].userList.length;
            for (j =  0; j < len2; j++) {
                if (ws === roomList[i].userList[j].ws) {
                    user = roomList[i].userList[j];
                    roomList[i].removeUser(user);
                    break;
                }
            }

            if (user !== null) { break; }
        }
    });

    ws.on('message', function (message) {
        var index = message.charCodeAt(0);

        message = message.substring(1);

        var i;
        var len1;

        if (index === 100) {
            var buff = String.fromCharCode(100);

            len1 = roomList.length;
            for (i = 0; i < len1; i++) {
                buff += roomList[i].userList.length + ' ';
                buff += roomList[i].symbol + ' ';

                if (roomList[i].isPlaying) {
                    buff += 'p';
                } else {
                    buff += 'r';
                }

                if (i < len1 - 1) { buff += ' '; }
            }

            try {
                ws.send(buff);
            } catch (e) {
            }

            return;
        } else if (index >= roomList.length || message.length === 0) { return; }

        var user = null;

        len1 = roomList[index].userList.length;
        for (i = 0; i < len1; i++) {
            if (ws === roomList[index].userList[i].ws) {
                user = roomList[index].userList[i];
                break;
            }
        }

        var param;

        if (user === null) {
            switch (message[0]) {
                case 'a':
                    sendUserList(index, ws);
                    break;
                case 'b':
                    login(index, ws, message);
                    break;
            }
        } else {
            switch (message[0]) {
                case 'c':
                    param = splitSyntaxType1(message);

                    roomList[index].onChat(user, param);

                    if (param.length > 1 && param[0] === '/') {
                        roomList[index].onCommand(user, param.split(' '));
                    }

                    break;
                case 'd':
                    param = splitSyntaxType1(message);

                    roomList[index].onMessage(user.uid, param);
                    break;
                case 'e':
                    roomList[index].resetChatCount(user.uid);
                    if(user && roomList[index].chatCount[user.uid] && roomList[index].chatCount[user.uid].count > 5) {
                        roomList[index].removeUser(user);
                        roomList[index].chat('?', 'deeppink', user.uid + 'を追放しました。');
                    }
                    roomList[index].chat('?', 'deeppink', user.uid + 'がベルを鳴らしました。');
                    roomList[index]._broadcast('J');
                    break;
                case 'f':
                    roomList[index].chat(
                          '?'
                        , 'deeppink'
                        , user.uid + 'のダイス=>[' + MersenneTwister.Share.nextInt(1, 100) + ']'
                    );
                    break;
            }
        }
    });
});

server.listen(process.env.PORT || 5000);

process.on('uncaughtException', function (e) {
     console.log('uncaughtException => ' + e);
});