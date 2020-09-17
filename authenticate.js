//We are going to use this file to store the authentication strategies that we will configure.
var passport = require('passport');
//The "passport-local" module exports a "Strategy" that we can use for our application.
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
//We will create JSON Web Token based strategy which is provided by "passport-jwt" Node module, for configuring our "passport" Node module.
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var FacebookTokenStrategy = require('passport-facebook-token');

var config = require('./config.js');

//Since we are using "passport-local-mongoose" plugin when defining the user Schema and model, 
//"passport-local-mongoose" adds method called "authenticate()" to the user Schema and model.
//Method "authenticate()" provides authentication for LocalStrategy.
//If we are not using "passport-local-mongoose" when defining user Schema and model, then we need
//to write our own user authetication function.
exports.local = passport.use(new LocalStrategy(User.authenticate()));
//Since we are using sessions to track users in our application, we need to serialize and deserialize the user.
//Passport adds "user" property to the request message object. That user information will be serialized and deserialized by
//using "serializeUser()" and "deserializeUser()" methods that are supported by "passport-local-mongoose" on user Schema and model.
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//"user" will be a JSON object. This function will create a token and give it to us.
//To create the token, we will use "jsonwebtoken" Node module. "jsonwebtoken" Node module provides a method called
//"sign()" which takes several parameters. The first parametar is the Payload and we will put the user information in there.
//The second parameter is the secret (private) key. After that we can supply additional options. We will specify "expiresIn"
//additional option which tells you how long the JSON Web Token will be valid. We will give it a value of 3600 seconds.
//That means that after 3600 seconds, you will have to re-new the JSON Web Token (the user have to re-authenticate himself).
exports.getToken = function (user) {
    return jwt.sign(user, config.secretKey,
        { expiresIn: 3600 });
};

//We will configure JSON Web Token Strategy for our Passport.
//"opts.jwtFromRequest" specifies how JSON Web Token should be extracted from the incoming request message.
//"opts.secretOrKey" is the secret key which we are going to be using within out Strategy for the signing.
var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

//We are exporting Passport Strategy which we will configure here.
//"JwtStrategy()" takes the strategy options as the first parameter. The second parameter is the
//verify function that we need to supply.
//"done()" is the callback that is provided by Passport. Through this "done()" we will be passing
//back information to Passport, which it will then use for loading things on to the request message. 
//So, we are going to be calling this "done()" function.
//"done()" takes three paramters - "done(error: any, user?: any, info?: any)". 
exports.jwtPassport = passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    console.log("JWT payload: ", jwt_payload);
    User.findOne({ _id: jwt_payload._id }, (err, user) => {
        if (err) {
            return done(err, false);
        }
        else if (user) {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    });
}));

//We are exporting the "verifyUser" function and we are going to be using it to verify an incoming user.
//The strategy is "jwt" strategy that we have configured in the code above. And we are not going to create 
//sessions in this case.
//So, if JSON Web Token is included in the Authorization header, then it will be extracted and it will be 
//used to authenticate the user.
exports.verifyUser = passport.authenticate('jwt', { session: false });

//This function will check an ordinary user to see if he has Admin privileges. When the user's token is 
//checked in "verifyUser()" function, it will load a new property named user to the request object.
//This will be available to you if the "verifyAdmin()" follows "verifyUser()" in the middleware order in Express. 
exports.verifyAdmin = (req, res, next) => {
    if (req.user) {
        if (req.user.admin) {
            return next();
        } else {
            var err = new Error('You are not authorized to perform this operation!');
            err.status = 403;
            return next(err);
        }
    } else {
        var err = new Error('You are not authenticated!');
        err.status = 403;
        return next(err);
    }
};

//Pravimo novu strategiju za autentifikaciju korisnika preko Facebook-a.
//Whenever the user logs in and then obtains the access token and passes it on to our Express server, the Express server is going to
//use that access token and go and fetch the profile information from the Facebook OAuth server. And then, once it obtains the profile information,
//then our Express server will create a new user account into our application, and use the Facebook ID as the index into this user account.
exports.facebookPassport = passport.use(new FacebookTokenStrategy({
    clientID: config.facebook.clientId,
    clientSecret: config.facebook.clientSecret
}, (accessToken, refreshToken, profile, done) => {
    //U ovoj callback funkciji proveravamo prvo da li se korisnik ranije vec ulogovao preko svoj Facebook naloga, posto u tom slucaju
    //njegov nalog bi vec bio napravljen sa "facebookId". "facebookId" korisnika koji se trenutno loguje mozemo naci u "profile.id".
    //This "profile" will carry a lot of information coming in from Facebook that we can use within our application.
    //The "accessToken" is supplied to the server by the user.
    User.findOne({ facebookId: profile.id }, (err, user) => {
        //Ako ima greska, vracamo gresku.
        if (err) {
            return done(err, false);
        }
        //Ako nema greska i korisnik sa tim "facebookId"-jem vec postoji u nasem sistemu, vracamo korisnika.
        //To znaci da se korisnik ranije vec logovao preko Facebook-a na nas sistem i da mu je profil na nasem sistemu vec napraviljen.
        if (!err && user !== null) {
            return done(null, user);
        }
        //Ako korisnik sa tim "facebookId"-jem ne postoji u nasem sistemu, onda cemo da mu napravimo nalog na nasem sistemu.
        else {
            //Pravimo novog korisnika sa "username"-om koji dobijamo iz "profile.displayName". Zatim popunjavamo i ostala polja
            //za tog korisnika. I vrednosti ostalih polja isto dobijamo iz "profile" objekta.
            user = new User({ username: profile.displayName });
            user.facebookId = profile.id;
            user.firstname = profile.name.givenName;
            user.lastname = profile.name.familyName;
            //We are saving the changes to the user.
            user.save((err, user) => {
                if (err)
                    return done(err, false);
                else
                    return done(null, user);
            })
        }
    });
}
));