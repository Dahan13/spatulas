const { WebSocket } = require('ws');
const { checkPassword } = require('./settingsUtilities')
const { toggleReady, toggleDelivered, togglePrepare } = require("./databaseUtilities")

const server = new WebSocket.Server({
  port: 8000
});

let sockets = [];
server.on('connection', function(socket) {
  sockets.push(socket);

  socket.on('message', function(msg) {
    msg = msg.toString('utf8');
    console.log('SOCKET Received : ', msg);
    result = msg.split('  ');
    checkPassword(result[0], (auth) => {
      if (auth) {
        if (result[2] == 0) {
          togglePrepare(result[1]);
        } else if (result[2] == 1) {
          toggleReady(result[1]);
        } else if (result[2] == 2) {
          toggleDelivered(result[1]);
        }
      }
    })
  });

  // When a socket closes, or disconnects, remove it from the array.
  socket.on('close', function() {
    sockets = sockets.filter(s => s !== socket);
  });
});