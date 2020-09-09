var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require('express-session');
//"session-file-store" Middleware takes "express-session" Middleware as the parameter
var FileStore = require('session-file-store')(session);
var passport = require('passport');
var authenticate = require('./authenticate');

var indexRouter = require("./routes/indexRouter");
var userRouter = require("./routes/userRouter");
var dishRouter = require("./routes/dishRouter");
var promotionRouter = require("./routes/promotionRouter");
var leaderRouter = require("./routes/leaderRouter");

const mongoose = require("mongoose");

const Dishes = require("./models/dishes");
const Leaders = require("./models/leaders");
const Promotions = require("./models/promotions");

const url = "mongodb://localhost:27017/conFusion";
//This will establish the connection to the databse
const connect = mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
});

connect.then(
    (db) => {
        console.log("Connected correctly to server");
    },
    (err) => {
        console.log(err);
    }
);

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//We will be using signed cookies. So, we are going to supply "secret key" as the parameter to the "cookie-parser".
//The secret key could be any string, so we are just going to supply a string "12345-67890-09876-54321". It doesn't have to be
//anything meaningful, it's just a key that can be used by our "cookie-parser" in order to encrypt the information and sign the cookie
//that is sent from the server to the client.
//app.use(cookieParser("12345-67890-09876-54321"));

//We will set up the "express-session" Middleware with the various options.
//"session-id" will be the name of the cookie that will be set up on the client side.
app.use(session({
    name: 'session-id',
    secret: '12345-67890-09876-54321',
    saveUninitialized: false,
    resave: false,
    store: new FileStore()
}));

//"passport.initialize()" Middleware is required to initialize Passport.
//If your application uses persistent login sessions, "passport.session()" Middleware must also be used.
//Upon completion of the successful authentication of the user by Passport, Passport adds a "user" property
//to the request message. The "passport.session()" Middleware will automatically serialize that user infomation
//and then store it in the session. Also, whenever incoming request comes in from the client side
//with the session cookie, then this will automatically load the "req.user" on to the incoming request. So, that
//is how "passport.session()" Middleware itself is organized.
app.use(passport.initialize());
app.use(passport.session());

app.use("/", indexRouter);
app.use("/users", userRouter);

//We want to do authentication right before we allow the client to be able to fetch data from out server.
//We will add authentication here. All the Middleware that comes after this particular point will have to
//go through the authorization phase before that Middleware can be accessed.
//We will implement a function named "auth" and then use it as the Middleware.
function auth(req, res, next) {
    console.log(req.user);
    //When the user is logged in, the "req.user" will be automatically loaded in by the "passport.session()" Middleware. 
    //If "req.user" exists, that means that Passport has done the authentication and the "req.user" is loaded on to the 
    //request message object.
    if (!req.user) {
        var err = new Error('You are not authenticated!');
        err.status = 403;
        next(err);
    } else {
        next();
    }
}
app.use(auth);

app.use(express.static(path.join(__dirname, "public")));

app.use("/dishes", dishRouter);
app.use("/promotions", promotionRouter);
app.use("/leaders", leaderRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
