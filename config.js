//We are going to use this file to store some configuration information for our server.
//This is a way of centralizing all the configuration for our server.
//"secretKey" is a secret key that we are going to be using for signing JSON Web Tokens.
//"mongoUrl" is a URL for our MongoDB Server.
//"facebook" is for authentification by Facebook
module.exports = {
    'secretKey': '12345-67890-09876-54321',
    'mongoUrl': 'mongodb://localhost:27017/conFusion',
    'facebook': {
        clientId: '639005376751880',
        clientSecret: '8ab827326bd7491995ee49c50be81641'
    }
}