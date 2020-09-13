const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//This will load this new Currency type into Mongoose
require('mongoose-currency').loadType(mongoose);
// @ts-ignore
const Currency = mongoose.Types.Currency;

var commentSchema = new Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
        //This means that every document of the Comment type should contain 
        //a rating field
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    //Koristimo Mongoose. "author" field will have a reference to the User document. Dakle "author" polje
    //ce imati referencu u vidu ObjectId-ja, a taj ObjectId ce biti ObjectId dokumenta koji je Schema-e User.
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    //The timestamps allow you to have two different fields in the document: the "createdAt" field
    //and the "updatedAt" field, both of which are timestamps stored
    //in the form of an ISO Date string in the document.

    timestamps: true
});

//When nesting schemas, always declare the child schema first before passing it into its parent.
var dishSchema = new Schema({
    name: {
        type: String,
        required: true,
        //This means that no two documents can have exactly the same "name" value in the document.
        //So, this ensures that each document will have a unique "name" field.
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    label: {
        type: String,
        //We can specify default value if we want. So, if we don't specify that field,
        //the default value will be added into the document.
        default: ''
    },
    price: {
        type: Currency,
        required: true,
        min: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    comments: [commentSchema]
}, {
    //We can have Mongoose automatically insert timestamps into our model. This will automatically add 
    //the "createdAt" and "updatedAt" fields into each document that is stored, and it will automatically update these values whenever 
    //we update the document. The "createdAt" will be automatically initialized when the document is created.
    timestamps: true
});

//Once we define the Schema, to make use of this in our application, we need to create a model
//from that Schema that we have defined. The first parameter of "mongoose.model()" is the name of 
//the model and we are specifying the name as "Dish". The second parameter is where we are specifying that model is of the type "dishSchema".
//When we use this "Dish" model in our Node application where we are making use of Mongoose, then that will be transformed and
//mapped into a collection in MongoDB database. The collection itself will be named as "dishes". So, when you specify a name for the model,
//Mongoose will automatically give the collection the name which is the plural of the model name that you specify.
//So, when we say "Dish", then Mongoose automatically will map that into the "dishes" collection in the MongoDB database. 
//How does it know how to convert this singular name to a plural? Mongoose Node module has a built-in
//mechanism that enables it to construct the plurals of standard English words.
var Dishes = mongoose.model('Dish', dishSchema);

//We are exporting the model
module.exports = Dishes;