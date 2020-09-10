//We are going to use this file to store some configuration information for our server.
//This is a way of centralizing all the configuration for our server.
//"secretKey" is a secret key that we are going to be using for signing JSON Web Tokens.
//"mongoUrl" is a URL for our MongoDB Server.
module.exports = {
    'secretKey': '12345-67890-09876-54321',
    'mongoUrl': 'mongodb://localhost:27017/conFusion'
}