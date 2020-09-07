var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require('express-session');
//"session-file-store" Midleware takes "express-session" Middleware as the parameter
var FileStore = require('session-file-store')(session);

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
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
app.use(session({
    name: 'session-id',
    secret: '12345-67890-09876-54321',
    saveUninitialized: false,
    resave: false,
    store: new FileStore()
}));

//We want to do authentication right before we allow the client to be able to fetch data from out server.
//We will add authentication here. All the Middleware that comes after this particular point will have to
//go through the authorization phase before that Middleware can be accessed.
//We will implement a function named "auth" and then use it as the Middleware.
function auth(req, res, next) {
    //"express-session" Middleware adds "session" property to the request message object.
    console.log(req.session);
    //If the incoming request does not include the "user" field in the "signed.Cookies", or does not include the "signed.Cookies" itself,
    // then that means that user has not been authorized yet. "user" will be a property that we will set up in the signed cookie. 
    //In that case we will expect the user to authenticate himself by including the Authorization Header.
    //if (!req.signedCookies.user) {
    if (!req.session.user) {
        var authHeader = req.headers.authorization;
        //If there is no Authentication Header in our incoming request, we will not allow our client request to go further beyond this point.
        if (!authHeader) {
            var err = new Error("You are not authenticated!");
            //If the client has not included the Authentication Heander, we are going to challenge the client to supply the Authentication Header.
            res.setHeader("WWW-Authenticate", "Basic");
            res.status(401); //Unauthorized access
            //This will go to the Error Handler, where the Error Handler will construct the reply message and sand it back to the client.
            next(err);
            return;
        }

        //For a Basic Authentication, Authentication Header is in the form of: first word is "Basic", and then followed by space,
        //and followed by a Base64 encoded string. Posto nama treba deo koji je "Base64 encoded string" (koji u stvari predstavlja
        //username i password koje je klijent uneo), mi cemo Authorization Header da split-ujemo sa "space"-om. Posto "split" vraca niz,
        //prvi clan niza ce biti "Basic", a drugi clan niza ce biti "Base64 encoded string". Mi cemo da uzmemo drugi clan niza
        //koji je u stvari "Base64 encoded string". Zatim odatle izdvajamo username i password.
        //"Baffer" nam dozvoljava da "split"-ujemo tu vrednost, a takodje mu prosledjujemo i "encoding of the Buffer" koji je u ovom slucaju "Base64 encoding".
        //Kada izdovimo "Base64 encoded string" u njemu se nalaze username i password u formi: "username:password", pa moramo jos jendom da "split"-ujemo sa
        //":" da bi izdvojili username i password. Kada odradimo sve ovo, "auth" treba da bude niz od dva clana. Prvi clan ce biti username a drugi clan password.
        var auth = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");
        var username = auth[0];
        var password = auth[1];
        if (username == "admin" && password == "password") {
            //If the user is an authorized user, we will set up the cookie. We are setting the name of the cookie as "user", and the value
            //of that "user" field as "admin". And we will set this up to be a signed cookie. We are setting the cookie field in the outgoing response
            //message and this will prompt the client to set up the cookie on the client side and then all subsequent requests will include this cookie
            //in the client request.
            //res.cookie("user", "admin", { signed: true });

            //If the username and password match the request, we are allowing the client request to pass through to the next Middleware.
            //We will set up the "user" propery on the "req.session".
            req.session.user = 'admin';
            next(); // authorized
        } else {
            //If the username and password did not match the request, we are going to challenge the client again to send in the correct authorization information (the username and password).
            var err = new Error("You are not authenticated!");
            res.setHeader("WWW-Authenticate", "Basic");
            res.status(401);
            return next(err);
        }
        //Signed cookie already exists and the "user" property is defined.
    } else {
        if (req.session.user === 'admin') {
            console.log('req.session: ', req.session);
            next();
        } else {
            var err = new Error("You are not authenticated!");
            res.status(401);
            return next(err);
        }
    }
}
app.use(auth);

app.use(express.static(path.join(__dirname, "public")));
app.use("/", indexRouter);
app.use("/users", usersRouter);
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
