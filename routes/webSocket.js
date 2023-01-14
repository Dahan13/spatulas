const { WebSocket } = require('ws');
const validator = require('validator');
const { checkPassword } = require('./settingsUtilities')
const { toggleReady, toggleDelivered, togglePrepare } = require("./databaseUtilities")


const server = new WebSocket.Server({
  port: 8000
});

let sockets = [];
server.on('connection', function(socket) {
  sockets.push(socket);

  socket.on('message', function(msg) {
    let message = validator.escape(msg.toString('utf-8'));
    console.log('SOCKET Received : ', message);
    result = message.split('  ');
    checkPassword(result[0], (auth) => {
      let userId = validator.toInt(result[1]);
      let action = validator.toInt(result[2]);
      switch (action) {
        case 0:
          togglePrepare(userId);
          break;
        case 1:
          toggleReady(userId);
          break;
        case 2:
          toggleDelivered(userId);
          break;
      }
    })
  });

  // When a socket closes, or disconnects, remove it from the array.
  socket.on('close', function() {
    sockets = sockets.filter(s => s !== socket);
  });
});