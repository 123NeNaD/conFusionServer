//In this file we will configure the "cors" Node module.
const express = require('express');
const cors = require('cors');
const app = express();

//The "whitelist" is an array of strings, and it contains all the origins that this server is willing to accept.
//Znaci da cemo samo "request"-ove sa ovih domena da prihvatamo.
//Our Angular client application, if we start it up with the "ng serve" command, it runs at "localhost:4200". 
//So any requests coming in from our Angular application to the server will carry that as the origin there. 
const whitelist = ['http://localhost:3000', 'https://localhost:3443', 'http://localhost:4200'];

//By calling this function "corsOptionsDelegate", we will check to see if the incoming request belongs to one of the "whitelist" origins.
//If it is, then you reply back with "Access-Control-Allow-Origin" with the origin of the request set in there. Otherwise it'll not include 
//"Access-Control-Allow-Origin" when it replies.
var corsOptionsDelegate = (req, callback) => {
    var corsOptions;
    console.log(req.header('Origin'));
    //If the incoming request header contains the "Origin" field, then we are going to check if that particular origin is
    //present in "whitelist" or not. If it is not present in "whitelist" the "indexOf()" will return -1 as result,
    //and if it is present in "whitelist" the "indexOf()" will return the index greater than or equal to zero.
    if (whitelist.indexOf(req.header('Origin')) !== -1) {
        //By saying "{origin: true}", this means that the original origin in the incoming request is in the whitelist. So will we allow it to be accepted.
        //So, when we set origin is equal to true here, then "cors" module will reply back saying "Access-Control-Allow-Origin", and then include that origin
        //into the header with the "Access-Control-Allow-Origin" key. So, that way our client side will be informed, saying it's okay for the server to accept
        //this request for this particular origin. 
        corsOptions = { origin: true };
    } else {
        //This means that the original origin in the incoming request is not in the whitelist.
        //When we set origin to false, then the "Access-Control-Allow-Origin" will not be returned by our server side.
        corsOptions = { origin: false };
    }
    callback(null, corsOptions);
};

//Sada definisemo "cors" i "corsWithOptions". U zavisnosti od odredjene "route", primenicemo jedno ili drugo.
//We will configure the "cors" by simply saying "cors()" without any options. This will reply back with "Access-Control-Allow-Origin" with the wild card "*".
//There are certain routes on which this is acceptable to do, especially whenever we perform GET operations. 
//Also, we will configure "corsWithOptions" by saying "cors()" and then we'll supply the "corsOptionsDelegate" function that we have defined above. 
//This way, if we need to apply "cors" with specific options to a particular route, we will use this corsWithOptions. Otherwise, we'll use the standard "cors".
//Znaci kada budemo koristili "cors" na nekom "endpoint"-u za neki odredjeni metod (GET, PUT, POST, DELETE), svim domenima ce biti dozvoljeno da pristupe.
//Kada budemo koristili "corsWithOptions" na nekom "endpoint"-u za neki odredjeni metod (GET, PUT, POST, DELETE), samo domenima koji se nalaze u "whitelist" ce 
//biti dozvoljeno da pristupe. Zato "cors" uglavnom koristimo za GET request-ove, a "corsWithOptions" koristimo za PUT, POST i DELETE request-ove.
exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);