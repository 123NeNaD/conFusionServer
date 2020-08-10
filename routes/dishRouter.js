const express = require('express');
const bodyParser = require('body-parser');

//This will declare dishRouter as an Express router - so mini-Express application
const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

//In index.js file, this express router is mounted at the "/dishes" endpoint
//By using this approach we are declaring the endpoint at one single location
//and we can chain "all()", "get()", "put()", "post()", and "delete()" methods to the ".route()".
//Endpoint is specified in ".route".
dishRouter.route('/')

  //This will be done for all requests (get, put, post and delete) on "/dishes" endpoint. When you call
  //"next()" it will continue to look for additional specifications which will match "/dishes" endpoint.
  //Na primer ako imamo GET request na "/dishes" endpoint-u onda ce se prvo izvrsiti "app.all()" deo za "/dishes"
  //endpoint i ako imamo "next()", onda ce da se proslede "req" i "res" iz "app.all()" (ako smo ih modifikovali u
  //"app.all()" prosledjuju se modifikovani)u "app.get()" pa ce se izvrsiti i "app.get()".
  //Isto vazi i za ostale metode "app.put()", "app.post()" i "app.delete()". 
  .all((req, res, next) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    next();
  })
  .get((req, res, next) => {
    res.end('Will send all the dishes to you!');
  })
  //When we use the "body-parser", the body of the incoming request will be parsed
  //and then added into the "req" object as "req.body". So, the "req.body" will give you access
  //to whatever is inside the body of the message.
  .post((req, res, next) => {
    res.end('Will add the dish: ' + req.body.name + ' with details: ' + req.body.description);
  })
  .put((req, res, next) => {
    res.statusCode = 403; //403 means the operation not supported
    res.end('PUT operation not supported on /dishes');
  })
  .delete((req, res, next) => {
    res.end('Deleting all dishes');
  });

dishRouter.route('/:dishId')
  .all((req, res, next) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    next();
  })
  .get((req, res, next) => {
    res.end('Will send details of the dish: ' + req.params.dishId + ' to you!');
  })
  .post((req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /dishes/' + req.params.dishId);
  })
  .put((req, res, next) => {
    res.write('Updating the dish: ' + req.params.dishId + '\n');
    res.end('Will update the dish: ' + req.body.name + ' with details: ' + req.body.description);
  })
  .delete((req, res, next) => {
    res.end('Deleting dish: ' + req.params.dishId);
  });

module.exports = dishRouter;