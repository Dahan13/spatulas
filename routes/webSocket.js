const { WebSocket } = require('ws');
const { checkPassword } = require('./settingsUtilities')

const server = new WebSocket.Server({
  port: 8000
});

let sockets = [];
server.on('connection', function(socket) {
  sockets.push(socket);

  // When you receive a message, send that message to every socket.
  socket.on('message', function(msg) {
    msg = msg.toString('utf8');
    console.log('SOCKET Received : ', msg);
    result = msg.split('  ');
    checkPassword(result[0], (auth) => {
      if (auth) {
        let userId = result[1];
        let payload = result[2];
      }
    })
    
  });

  // When a socket closes, or disconnects, remove it from the array.
  socket.on('close', function() {
    sockets = sockets.filter(s => s !== socket);
  });
});