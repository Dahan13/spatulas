const { WebSocket } = require('ws');
const validator = require('validator');
let pool = require('./databaseConnector');
const { checkPassword } = require('./settingsUtilities')
const { toggleCommandBoolean } = require("./databaseUtilities")


const server = new WebSocket.Server({
  port: 8000
});

let sockets = [];
server.on('connection', function(socket) {
  sockets.push(socket);

  socket.on('message', function(msg) {
    let message = validator.escape(msg.toString('utf-8')); // Sanitizing user inputs
    console.log('SOCKET Received : ', message);
    result = message.split('  ');
    checkPassword(result[0], async (auth) => {
      if (auth) {
        let userId = validator.toInt(result[1]);
        let action = validator.toInt(result[2]);
        let conn = await pool.promise().getConnection()
        let toToggle = ""
          switch (action) {
            case 0:
              toToggle = "preparation";
              break;
            case 1:
              toToggle = "ready";
              break;
            case 2:
              toToggle = "delivered";
              break;
          }
          await toggleCommandBoolean(userId, toToggle, conn)
          conn.release();
      }
    })
  });

  // When a socket closes, or disconnects, remove it from the array.
  socket.on('close', function() {
    sockets = sockets.filter(s => s !== socket);
  });
});

/**
 * This function will send a message to all connected sockets, indicating that it's a timeCount refresh, the timestamp of the refresh, and the new timeCount.
 * @param {String} time The timestamp of the refresh
 * @param {Number} timeCount The new timeCount
 */
function sendTimeCount(time, timeCount) {
  console.log(`SOCKET Sent : timeCountUpdate ${time} ${timeCount}`)
  sockets.forEach(socket => {
    socket.send(`timeCountUpdate ${time} ${timeCount}`);
  });
}

module.exports = {
  sendTimeCount
}