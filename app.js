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
var config = require('./config');

var indexRouter = require("./routes/indexRouter");
var userRouter = require("./routes/userRouter");
var dishRouter = require("./routes/dishRouter");
var promotionRouter = require("./routes/promotionRouter");
var leaderRouter = require("./routes/leaderRouter");

const mongoose = require("mongoose");

const Dishes = require("./models/dishes");
const Leaders = require("./models/leaders");
const Promotions = require("./models/promotions");

const url = config.mongoUrl;
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

//"passport.initialize()" Middleware is required to initialize Passport.
app.use(passport.initialize());

app.use("/", indexRouter);
app.use("/users", userRouter);

app.use(express.static(path.join(__dirname, "public")));

//We will let all "get" requests on this routes be replied to without requiring any authenticaion.
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
