//We are going to use this file to store the authentication strategies that we will configure.
var passport = require('passport');
//The "passport-local" module exports a "Strategy" that we can use for our application.
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');

//Since we are using "passport-local-mongoose" plugin when defining the user Schema and model, 
//"passport-local-mongoose" adds method called "authenticate()" to the user Schema and model.
//Method "authenticate()" provides authentication for LocalStrategy.
//If we are not using "passport-local-mongoose" when defining user Schema and model, then we need
//to write our own user authetication function.
passport.use(new LocalStrategy(User.authenticate()));
//Since we are using sessions to track users in our application, we need to serialize and deserialize the user.
//Passport adds "user" property to the request message object. That user information will be serialized and deserialized by
//using "serializeUser()" and "deserializeUser()" methods that are supported by "passport-local-mongoose" on user Schema and model.
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());