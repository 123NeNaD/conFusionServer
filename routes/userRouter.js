var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate');
const cors = require('./cors');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
//We are applying "cors.corsWithOptions" even if this is GET, because this can be performed only by admin.
router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    User.find({})
        .then((users) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            //"res.json()" takes as a parameter a JSON string, and then it will put
            //that into the body of the response message and send it back to the client.
            res.json(users);
            //If an error is returned, the error will be passed to overall error handler for our application.
        }, (err) => next(err))
        .catch((err) => next(err));
});

//This "/signup" endpoint will allow a user to sign up on the system. Only the "post" method will be allowed on 
//"/signup" endpoint. The remaining methods will not be allowed. 
router.post('/signup', cors.corsWithOptions, (req, res, next) => {
    //The "passport-local-mongoose" plugin provides us with a method called "register" on the user Schema and model.
    //"register(user, password, callback)" is a convenience method to register a new user instance with a given password. It also checks if username is unique.
    User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
        if (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({ err: err });
        } else {
            //After the user is successfuly registered, we will set the "firstname" and "lastname" filed of the user.
            //Ako "body of the request message" sadrzi "firstname" onda cemo tu vrednost da dodamo korisniku u polje "firstname". 
            //Ako "body of the request message" ne sadrzi "firstname", default "" se upisuje korisniku u polje "firstname". 
            if (req.body.firstname)
                user.firstname = req.body.firstname;
            //Ako "body of the request message" sadrzi "lastname" onda cemo tu vrednost da dodamo korisniku u polje "lastname". 
            //Ako "body of the request message" ne sadrzi "lastname", default "" se upisuje korisniku u polje "lastname". 
            if (req.body.lastname)
                user.lastname = req.body.lastname;
            //Saving the modification that we have done to the user (we have updated "firstname" and "lastname")
            user.save((err, user) => {
                if (err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ err: err });
                    return;
                }
                //To ensure that the user registration was seccessful, we will try to authenticate the
                //same user that we just registered.
                passport.authenticate('local')(req, res, () => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({ success: true, status: 'Registration Successful!' });
                });
            });
        };
    });
});

//This "/login" endpoint will allow a user to login on the system. Only the "post" method will be allowed on 
//"/login" endpoint. The remaining methods will not be allowed. We are doing the "post" for logging in because for
//logging in we need to submit the username and password. Here, we expect the username and password to be included
//in the body if the incoming post message.
//So, when the "router.post()" comes on the "/login" endpoint, we will first call the "passport.authenticate('local')". If
//this is successful then the "(req,res)=>" function will be executed. If there is any error in the authentication, this
//"passport.authenticate('local')" will automatically send back a reply to the client about the failure of the authentication.
//If the user is logged in, then the "passport.authenticate('local')" will automatically add the "user" property to the request message object. 
//This is where we will create JSON Web Token.
//To issue the JSON Web Token, we first need to authenticate the user using one of the other strategies. So, we are first using
//Local Strategy and we are authenticating the user using username and password. Once the user is authenticated
//with the username and password, then we will issue the token to the user. All subsequent requests will simply
//carry the token in the Authorization header of the incoming request message.
//For creating a token, we will use the function "authenticate.getToken()" that we have define in "authenticate.js" 
//file and we will pass as the parameter the user_id, so that it can be stored in the Payload part of JSON Web Token that we are creating.
//When we create the JSON Web Token, we will sent it back to the client in a response message.
router.post('/login', cors.corsWithOptions, passport.authenticate('local'), (req, res) => {
    var token = authenticate.getToken({ _id: req.user._id });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    //Sending back the token as one of the properties in the reply message.
    res.json({ success: true, token: token, status: 'You are successfully logged in!' });
});

//This "/logout" endpoint will allow a user to logout from the system. Only the "get" method will be allowed on 
//"/logout" endpoint. The remaining methods will not be allowed. We are doing the "get" for logging out because for
//logging out we dont need  to submit any information.
router.get('/logout', cors.corsWithOptions, (req, res, next) => {
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
