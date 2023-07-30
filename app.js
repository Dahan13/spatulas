var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs');
var rfs = require('rotating-file-stream') // version 2.x

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/spatulas');
let logsRouter = require('./routes/logs');
let webSocket = require('./routes/webSocket');
let timeRouter = require('./routes/time');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Creating a log system

app.use(logger('dev')); // This is the default CLI logger

// Manage the log files
var accessLogStream = rfs.createStream('./logs/' + (new Date()).getDate() + "-" + ((new Date()).getMonth() + 1) + "-" + (new Date()).getFullYear() + '.log', { // create a rotating write stream
  interval: '1d', // rotate daily
  path: path.join(__dirname, '')
})
// Creating the file if it doesn't exist
let logPath = './logs/' + (new Date()).getDate() + "-" + ((new Date()).getMonth() + 1) + "-" + (new Date()).getFullYear() + '.log';
if (!fs.existsSync(logPath)) {
  fs.open(logPath, 'w', (err, fd) => {});
}

// setup the logger
app.use(logger('combined', { stream: accessLogStream }))

// app setup
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/spadmin', usersRouter);
app.use('/logs', logsRouter);
app.use('/spadmin/time', timeRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
