var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var dishRouter = require('./routes/dishRouter');
var promotionRouter = require('./routes/promotionRouter');
var leaderRouter = require('./routes/leaderRouter');

const mongoose = require('mongoose');

const Dishes = require('./models/dishes');
const Leaders = require('./models/leaders');
const Promotions = require('./models/promotions');

const url = 'mongodb://localhost:27017/conFusion';
const connect = mongoose.connect(url);

connect.then((db) => {
    console.log("Connected correctly to server");
}, (err) => { console.log(err); });

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//We want to do authentication right before we allow the client to be able to fetch data from out server.
//We will add authentication here. All the Middleware that comes after this particular point will have to
//go through the authorization phase before that Middleware can be accessed.
//We will implement a function named "auth" and then use it as the Middleware.
function auth(req, res, next) {
    console.log(req.headers);
    var authHeader = req.headers.authorization;
    //If there is no Authentication Header in our incoming request, we will not allow our client request to go further beyond this point.
    if (!authHeader) {
        var err = new Error('You are not authenticated!');
        //If the client has not included the Authentication Heander, we are going to challenge the client to supply the Authentication Header. 
        res.setHeader('WWW-Authenticate', 'Basic');
        err.status = 401; //Unauthorized access
        //This will go to the Error Handler, where the Error Handler will construct the reply message and sand it back to the client.
        next(err);
        return;
    }

    //Since the "authHeader" is a string, we are going to split that value
    //For a Basic Authentication, Authentication Header in in the form of: first word is "Basic", and then followed by space,
    //and followed by a Base64 encoded string. Posto nama treba deo koji je "Base64 encoded string" (koji u stvari predstavlja
    //username i password koje je klijent uneo), mi cemo Authorization Header da split-ujemo sa "space"-om. Posto "split" vraca niz, 
    //prvi clan niza ce biti "Bacic", a drugi clan niza ce biti "Base64 encoded string". Mi cemo da uzmemo drugi clan niza 
    //koji je u stvari "Base64 encoded string". Zatim odatle izdvajamo username i password.
    //"Baffer" nam dozvoljava da "split"-ujemo tu vrednost, a takodje mu prosledjujemo i "encoding of the Buffer" koji je u ovom slucaju "Base64 encoding".
    //Kada izdovimo "Base64 encoded string" u njemu se nalaze username i password u formi: "username:password", pa moramo jos jendom da "split"-ujemo sa 
    //":" da bi izdvojili username i password. Kada odradimo sve ovo, "auth" treba da bude niz od dva clana. Prvi clan ce biti username a drugi clan password.
    var auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    var username = auth[0];
    var password = auth[1];
    if (username == 'admin' && password == 'password') {
        //If the username and password match the request, we are allowing the client request to pass through to the next Middleware.
        next(); // authorized
    } else {
        //If the username and password did not match the request, we are going to challenge the client again to send in the correct authorization information (the username and password).
        var err = new Error('You are not authenticated!');
        res.setHeader('WWW-Authenticate', 'Basic');
        err.status = 401;
        next(err);
    }
}
app.use(auth);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/dishes', dishRouter);
app.use('/promotions', promotionRouter);
app.use('/leaders', leaderRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
