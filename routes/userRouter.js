var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

//This "/signup" endpoint will allow a user to sign up on the system. Only the "post" method will be allowed on 
//"/signup" endpoint. The remaining methods will not be allowed. 
router.post('/signup', (req, res, next) => {
    //The "passport-local-mongoose" plugin provides us with a method called "register" on the user Schema and model.
    //"register(user, password, callback)" is a convenience method to register a new user instance with a given password. It also checks if username is unique.
    User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
        if (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({ err: err });
        } else {
            //To ensure that the user registration was seccessful, we will try to authenticate the
            //same user that we just registered.
            passport.authenticate('local')(req, res, () => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({ success: true, status: 'Registration Successful!' });
            });
        }
    });
});

//This "/login" endpoint will allow a user to login on the system. Only the "post" method will be allowed on 
//"/login" endpoint. The remaining methods will not be allowed. We are doing the "post" for logging in because for
//logging in we need to submit the username and password. Here, we expect the username and password to be included
//in the body if the incoming post message.
//So, when the "router.post()" comes on the "/login" endpoint, we will first call the "passport.authenticate('local')". If
//this is successful then the "(req,res)=>" function will be executed. If there is any error in the authentication, this
//"passport.authenticate('local')" will automatically send back a reply to the client about the failure of the authentication.
//If the user is logged in, then the "passport.authenticate('local')" will automatically add the "user" property to the request message. 
router.post('/login', passport.authenticate('local'), (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, status: 'You are successfully logged in!' });
});

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
        //The "req.clearCookie('session-id')" is a way of asking the client to delete the cookie with the name "session-id"
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
