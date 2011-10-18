var socketIo  = require('socket.io');
var parseCookie = require('connect').utils.parseCookie;

module.exports = function(app, sessionStore, models) {

  // Socket.io
  var io = socketIo.listen(app); 

  io.configure(function () {
    io.set('authorization', function (handshakeData, callback) {
      if(handshakeData.headers.cookie) {
        var cookie = handshakeData.headers.cookie;
        var sessionID = parseCookie(cookie)['connect.sid'];
        sessionStore.get(sessionID, function(err, session) {
          handshakeData.session = session;
          callback(null, true);
        }); 
      }   
    }); 
  });

  io.of('/posts').on('connection', function(socket) {

    if (socket.handshake.session) {
      var user = socket.handshake.session.user; 
    }

    /* public */
    socket.on('next', function(msg) {
      var session = models.getSession();
      session.transaction(function(tx) {
        models.Post.all(session).order('created_at', models.DESC).limit(5).skip(msg.offset).list(tx, function(posts) {
        socket.emit('next', posts[0]);
        session.close();
        });
      });
    });

    socket.on('disconnect', function() {
    });

    /* admin */
    if (user) {
      socket.on('update', function(msg) {
      });
    }

  });
}
