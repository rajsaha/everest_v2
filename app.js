var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
app.io = io;

//mongodb connection
mongoose.connect("mongodb://everest:everest@ds261118.mlab.com:61118/everest");
var db = mongoose.connection;

//mongo error
db.on('error', console.error.bind(console, 'connection error:'));

//use sessions for tracking logins
app.use(session({
  secret: 'everest, a social network for free academic resources',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));

//make user ID available in templates
app.use(function (req, res, next) {
  res.locals.currentUser = req.session.userId;
  next();
});

//parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//serve statis files from /public
app.use(express.static(__dirname + '/public'));

//view engine setup
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

//include routes
var routes = require('./routes/index')(io);
app.use('/', routes);

//catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('File not found');
  err.status = 404;
  next(err);
});

//error handler
//define as the last app.use callback
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

server.listen(3000, function() {
  console.log('Socket app listening on port 3000');
});
