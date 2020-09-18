var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate');
const cors = require('./cors');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
//We will add "router.options" field here because sometimes a POST request as you saw with the login, we'll send 
//the options first to check, especially with CORS, whether the POST request will be allowed.
//So for any endpoint under users if we received the OPTIONS will simply return a status 200 here. 
router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });
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
router.post('/login', cors.corsWithOptions, (req, res, next) => {
    //When we call this, if a authentication error occurs the "passport.authenticate" can be made to return the error value, and also it'll
    //return the user if there is no error. And third parameter called "info", which will carry additional info that might be passed back to the
    //user. error will be returned when there is a genuine error that occurs in the "passport.authenticate". But if the user information is sent in
    //to "passport.authenticate" but the user doesn't exist, then that is not counted as an error. Instead, it will be counted as user doesn't exist.
    //And that information is passed back in the "info" object. So the error will be returned when there is a genuine error that occurs during the
    //authentication process, but the "info" will contain information if the user doesn't exist and so the "passport.authenticate" is passing back
    //a message saying that the user doesn't exist or either the username is incorrect or the password is incorrect, and so on.
    //And not only that, when we call this "passport.authenticate", we also need to pass in a (req, res, next) as the three parameters to it. 
    //So this is the structure when you need to call "passport.authenticate" and expect it to pass you back information like this as a callback method here.
    //Dakle (req, res, next) se ukljucuju nakon "passport.authenticate", jednostavno je takva sintaksa.
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        //If either the username or password is incorect. Znaci da ili nije pronadjen korisnik sa tim korisnickim imenom, ili je lozinka netacna.
        //Razlog zasto je logovanje korisnika bilo neuspesno bice sadrzan u "info" koji saljemo nazad korisniku.
        if (!user) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: false, status: 'Login Unsuccessful!', err: info });
        }
        //The "passport.authenticate" will add method "req.logIn".
        //So, we will try to login the user. We are passing the "user" as the parameter to "req.logIn()".
        req.logIn(user, (err) => {
            if (err) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.json({ success: false, status: 'Login Unsuccessful!', err: 'Could not log in user!' });
            }
            //Ako smo dosli do ovde, to znaci da se korisnik uspesno ulogovao, i mozemo da napravimo JSON Web Token
            //koji saljemo korisniku.
            var token = authenticate.getToken({ _id: req.user._id });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: true, status: 'Login Successful!', token: token });
        });
    })(req, res, next);
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

//Ovu "route"-u koristimo za logovanje preko Facebook-a. Ako korisnik nema nalog na nasem sistemu, bice mu napravljen nalog, a 
//ako se vec ranije logovao preko Facebook-a na nas sistem, to znaci da vec ima nalog na nasem sistemu, i u tom slucaju ce biti 
//ulogovan na nas sistem.
//So, if the user sends a GET request to "users/facebook/token" endpoint, then we're going to be authenticating the user using 
//the Facebook OAuth2-based authentication.
//Kada se korisnik uloguje preko Facebook-a, on od Facebook-a dobije Acces Token, i taj Acces Token korisnik onda salje serveru.
//So, the user is sending the Access Token to the Express server, the Express server uses the Access Token to go to Facebook and then
//fetch the profile of the user. And if the user doesn't exist, we'll create a new user with that Facebook ID. And then after that, our 
//Express server will generate a JSON Web Token and then return the JSON Web Token to our client. All subsequent accesses from our user
//will have to include this JSON Web Token that we have just returned. So at this point you no longer need the Facebook Access Token anymore.
//You can discard the Facebook Access Token at this point because the JSON Web Token is the one that keeps the users authentication active
//for whatever duration that this JSON Web Token is active. 
router.get('/facebook/token', passport.authenticate('facebook-token'), (req, res) => {
    //When we call "passport.authenticate()" with the "facebook-token" strategy, if it is successful, it would have loaded
    //in the "user" into the "req" (request) object. 
    if (req.user) {
        //Pravimo JSON Web Token isto kao sto smo radili i kada se korisnik uloguje preko Local Authenitcation Strategy ("/login" endpoint).
        var token = authenticate.getToken({ _id: req.user._id });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: true, token: token, status: 'You are successfully logged in!' });
    }
});

//It is quite possible that while the client has logged in and obtained the JSON Web Token, sometime later, the JSON Web Token may expire. 
//And so if the user tries to access from the client side with an expired token to the server, then the server will not be able to authenticate 
//the user. So at periodic intervals we may wish to cross-check to make sure that the JSON Web Token is still valid. So that is the reason why 
//we are including another endpoint called "/checkJWTtoken", so if you do a GET to the "/checkJWTToken" by including the token into the 
//Authorization Header, then this call will return a true or false to indicate to you whether the JSON Web Token is still valid or not.
//If it is not valid then the client side can initiate another login for For the user to obtain a new JSON Web Token, if required.
router.get('/checkJWTtoken', cors.corsWithOptions, (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            return res.json({ status: 'JWT invalid!', success: false, err: info });
        }
        else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({ status: 'JWT valid!', success: true, user: user });
        }
    })(req, res, next);
});

module.exports = router;
