var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

//This "/signup" endpoint will allow a user to sign up on the system. Only the "post" method will be allowed on 
//"/signup" endpoint. The remaining methods will not be allowed. 
router.post('/signup', (req, res, next) => {
    //Ako korisnik sa unetim korisnickim imenom vec postoji, nece biti omogucena prijava na sistem.
    User.findOne({ username: req.body.username })
        .then((user) => {
            if (user != null) {
                var err = new Error('User ' + req.body.username + ' already exists!');
                err.status = 403;
                next(err);
            }
            //Uneto korisnicko ime nije zauzeto i mozemo da odobrimo korisniku da se prijavi na sistem.
            else {
                return User.create({
                    username: req.body.username,
                    password: req.body.password
                });
            }
        })
        //Kada se registruje novi korisnik, on se prosledjuje ovom drugom ".then" kao "promise".
        .then((user) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({ status: 'Registration Successful!', user: user });
        }, (err) => next(err))
        .catch((err) => next(err));
});

//This "/login" endpoint will allow a user to login on the system. Only the "post" method will be allowed on 
//"/login" endpoint. The remaining methods will not be allowed. We are doing the "post" for logging in because for
//logging in we need to submit the username and password. 
router.post('/login', (req, res, next) => {
    //If the incoming request does not include the "user" field in the "req.session.", then that means that user has not been authorized yet,
    //and in that case we will expect the user to authenticate himself by including the Authorization Header. "user" will be a property that we will set up. 
    if (!req.session.user) {
        var authHeader = req.headers.authorization;
        //If the client has not included the Authentication Heander, we are going to challenge the client to supply the Authentication Header.
        if (!authHeader) {
            var err = new Error('You are not authenticated!');
            res.setHeader('WWW-Authenticate', 'Basic');
            err.status = 401;
            return next(err);
        }
        //For a Basic Authentication, Authentication Header is in the form of: first word is "Basic", and then followed by space,
        //and followed by a Base64 encoded string. Posto nama treba deo koji je "Base64 encoded string" (koji u stvari predstavlja
        //username i password koje je klijent uneo), mi cemo Authorization Header da split-ujemo sa "space"-om. Posto "split" vraca niz,
        //prvi clan niza ce biti "Basic", a drugi clan niza ce biti "Base64 encoded string". Mi cemo da uzmemo drugi clan niza
        //koji je u stvari "Base64 encoded string". Zatim odatle izdvajamo username i password.
        //"Baffer" nam dozvoljava da "split"-ujemo tu vrednost, a takodje mu prosledjujemo i "encoding of the Buffer" koji je u ovom slucaju "Base64 encoding".
        //Kada izdovimo "Base64 encoded string" u njemu se nalaze username i password u formi: "username:password", pa moramo jos jendom da "split"-ujemo sa
        //":" da bi izdvojili username i password. Kada odradimo sve ovo, "auth" treba da bude niz od dva clana. Prvi clan ce biti username a drugi clan password.
        var auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
        var username = auth[0];
        var password = auth[1];

        //We are going to search in the database to see if that particular user exists.
        User.findOne({ username: username })
            .then((user) => {
                if (user === null) {
                    var err = new Error('User ' + username + ' does not exist!');
                    err.status = 403;
                    return next(err);
                }
                else if (user.password !== password) {
                    var err = new Error('Your password is incorrect!');
                    err.status = 403;
                    return next(err);
                }
                else if (user.username === username && user.password === password) {
                    req.session.user = 'authenticated';
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('You are authenticated!')
                }
            })
            .catch((err) => next(err));
    } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('You are already authenticated!');
    }
})

//This "/logout" endpoint will allow a user to logout from the system. Only the "get" method will be allowed on 
//"/logout" endpoint. The remaining methods will not be allowed. We are doing the "get" for logging out because for
//logging out we dont need  to submit any information.
router.get('/logout', (req, res, next) => {
    if (req.session) {
        //The session itself provides a method "destroy()". When you call "destroy()" method, the session is destroyed
        //and the information pertaining to this session is removed from the server side. So, "destroy()" method 
        //destroys the session and will unset the req.session property. This means that, if the client
        //tries again to send the session information which is stored in the form of a signed cookie in the client side,
        //that will be invalid. So, we need a method of deleting the cookie that is stored on the client side.
        //The "req.clearCookie('session-id')" is a way of asking the client to remove the cookie with the name "session-id"
        //from the client side. After that we will redirect the client to the homepage.
        req.session.destroy();
        res.clearCookie('session-id');
        res.redirect('/');
    }
    //We are trying to logout a user that has not logged in.
    else {
        var err = new Error('You are not logged in!');
        err.status = 403;
        next(err);
    }
});

module.exports = router;
