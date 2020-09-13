var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

//"username" and "password" will be automatically added in by "passport-local-mongoose".
//Using "passport-local-mongoose" as a plugin in our mongoose Schema and model.
//This will automatically add a "username", "hash" and "salt" fields to store the username,
//the hashed password and the salt value. It also adds support for additional methods 
//on the user Schema and the model which are useful for passport authetication.
var userSchema = new Schema({
    firstname: {
        type: String,
        default: ''
    },
    lastname: {
        type: String,
        default: ''
    },
    admin: {
        type: Boolean,
        default: false
    }
});

//Using "passport-local-mongoose" as a plugin in our mongoose Schema and model.
//This will automatically add a "username", "hash" and "salt" fields to store the username,
//the hashed password and the salt value. It also adds support for additional methods 
//on the user Schema and the model which are useful for passport authetication.
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);