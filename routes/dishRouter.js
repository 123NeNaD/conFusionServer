const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const cors = require('./cors');

const Dishes = require('../models/dishes');

//This will declare dishRouter as an Express router - so mini-Express application
const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

//In index.js file, this express router is mounted at the "/dishes" endpoint
//By using this approach we are declaring the endpoint at one single location
//and we can chain "all()", "get()", "put()", "post()", and "delete()" methods to the ".route()".
//Endpoint is specified in ".route".
dishRouter.route('/')
    //Now, for the "dishRouter", we are going to set up the options. Whenever you need to preflight your requests, the client will 
    //send the HTTP OPTIONS request message and then obtain the reply from the server side before it actually sends the actual request. 
    //When an OPTIONS message is received on this particular route, then we will respond as "cors.corsWithOptions", and with the callback 
    //function which says "res.sendStatus(200)". We don't need to send anything more than just the status.
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })

    //This will be done for all requests (get, put, post and delete) on "/dishes" endpoint. When you call
    //"next()" it will continue to look for additional specifications which will match "/dishes" endpoint.
    //Na primer ako imamo GET request na "/dishes" endpoint-u onda ce se prvo izvrsiti "app.all()" deo za "/dishes"
    //endpoint i ako imamo "next()", onda ce da se proslede "req" i "res" iz "app.all()" (ako smo ih modifikovali u
    //"app.all()" prosledjuju se modifikovani)u "app.get()" pa ce se izvrsiti i "app.get()".
    //Isto vazi i za ostale metode "app.put()", "app.post()" i "app.delete()". 
    //Ovo je ".all()" metod, ali ga necemo koristiti nego cemo umesto toga da dodamo taj deo posebno u sve ostale metode.
    // .all((req, res, next) => {
    //   res.statusCode = 200;
    //   res.setHeader('Content-Type', 'text/plain');
    //   next();
    // })

    .get(cors.cors, (req, res, next) => {
        //"req.query" sadrzi sve query parametre iz request message. Express te query parametre pretvori u JSON object i mi jednostavno
        //mozemo direktno "req.query" da ubacimo kao parametar filtra za pretragu i kao rezultat ce biti vraceno sve sto ispunjava
        //uslove date query parametrima.
        Dishes.find(req.query)
            //We are using Mongoose Population. By stating this ".populate('comments.author')", we are saying when the dishes document
            //has been constructed to send back the reply to the user, we are going to populate the author field by User document.
            .populate('comments.author')
            .then((dishes) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                //"res.json()" takes as a parameter a JSON string, and then it will put
                //that into the body of the response message and send it back to the client.
                res.json(dishes);
                //If an error is returned, the error will be passed to overall error handler for our application.
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    //When we use the "body-parser", the body of the incoming request will be parsed
    //and then added into the "req" object as "req.body". So, the "req.body" will give you access
    //to whatever is inside the body of the message.
    //If we want to apply multiple Middleware, we can simply add them one behind the other.
    //Now, if a "post" request comes in, first "authenticate.verifyUser" will be executed and then,
    //if this is successful then it will move to the "(req, res, next) =>". If the authentication fails
    //then Passport will reply back to the client with the appropriate error message. 
    //So, this way we are making sure that only the authenticated user can access this endpoint.
    //Nakon sto proveravamo da li je korisnik registrovan korisnik, proveravamo i da li je korisnik 
    //admin, i u zavisnosti od toga ga pustamo dalje ili ne.
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Dishes.create(req.body)
            .then((dish) => {
                console.log('Dish Created ', dish);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(dish);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403; //403 means the operation not supported
        res.setHeader('Content-Type', 'text/plain');
        res.end('PUT operation not supported on /dishes');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Dishes.deleteMany({})
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));
    });

dishRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    // .all((req, res, next) => {
    //     res.statusCode = 200;
    //     res.setHeader('Content-Type', 'text/plain');
    //     next();
    // })
    .get(cors.cors, (req, res, next) => {
        Dishes.findById(req.params.dishId)
            .populate('comments.author')
            .then((dish) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(dish);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /dishes/' + req.params.dishId);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Dishes.findByIdAndUpdate(req.params.dishId, {
            //The update will be in the body of the message.
            $set: req.body
        }, { new: true })
            .then((dish) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(dish);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Dishes.findByIdAndDelete(req.params.dishId)
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));
    });

dishRouter.route('/:dishId/comments')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        Dishes.findById(req.params.dishId)
            .populate('comments.author')
            .then((dish) => {
                if (dish != null) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    // @ts-ignore
                    res.json(dish.comments);
                }
                else {
                    var err = new Error('Dish ' + req.params.dishId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Dishes.findById(req.params.dishId)
            .then((dish) => {
                if (dish != null) {
                    //The body of the request message contains the comment already, but the author property will not be there
                    //in the body of the request message. So, depending on which user is posting this information we can
                    //populate the author field. S obzirom da je odgovarajuci korisnik vec autentifikovan da bi dosao do ovog dela,
                    //vec imamo tog korisnika u "req.user" property-ju. Dakle, uzimamo "_id" korisnika koji predstavlja ObjectID
                    //odgovarajuceg User documenta i to pamtimo u "author" polju. Tako da vise klijent nece unositi svoje ime, vec
                    //ce se to automatski obavljati na serveru kada korisnik pokusa da onese komentar, nakon autentifikacije tog korisnika.
                    req.body.author = req.user._id;
                    dish.comments.push(req.body);
                    dish.save()
                        .then((dish) => {
                            //Sada vracamo nazad Dish information korisnik-u, ali nakon nalazenja odgovarajuceg "Dish"-a, radimo
                            //Mongoose Population "author" field-a i onda tek vracamo rezultat.
                            Dishes.findById(dish._id)
                                .populate('comments.author')
                                .then((dish) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(dish);
                                })
                        }, (err) => next(err));

                }
                else {
                    var err = new Error('Dish ' + req.params.dishId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /dishes/' + req.params.dishId + '/comments');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Dishes.findById(req.params.dishId)
            .then((dish) => {
                if (dish != null) {
                    //There is no easy way of pulling out all the comments from the array when you have a subdocument.
                    //So, we have to go in and delete each subdocument one by one.
                    for (var i = (dish.comments.length - 1); i >= 0; i--) {
                        //With ".id()" we are accessing the subodcument by specifying the "_id" of subdocument as a parameter to ".id()".
                        dish.comments.id(dish.comments[i]._id).remove();
                    }
                    dish.save()
                        .then((dish) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(dish);
                        }, (err) => next(err));
                }
                else {
                    var err = new Error('Dish ' + req.params.dishId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

dishRouter.route('/:dishId/comments/:commentId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        Dishes.findById(req.params.dishId)
            .populate('comments.author')
            .then((dish) => {
                if (dish != null && dish.comments.id(req.params.commentId) != null) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(dish.comments.id(req.params.commentId));
                }
                else if (dish == null) {
                    var err = new Error('Dish ' + req.params.dishId + ' not found');
                    err.status = 404;
                    return next(err);
                }
                else {
                    var err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('POST operation not supported on /dishes/' + req.params.dishId + '/comments/' + req.params.commentId);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Dishes.findById(req.params.dishId)
            .then((dish) => {
                if (dish != null && dish.comments.id(req.params.commentId) != null) {
                    //Korisnik moze da update-uje komentar samo ako ga je on i napravio. Korisnik ne moze da menja komentare
                    //koji pripadaju drugim korisnicima. Zato upredjujemo "req.user._id" koji "authenticate.verifyUser" dodaje
                    //nakon uspesne autentifikacije, sa poljem "author" iz tog komentara posto polje "author" sadrzi ObjectId
                    //korisnika koji je napravio taj komentar.
                    //ObjectIDs behave like Strings, and hence when comparing two ObjectIDs, you should 
                    //use the "Id1.equals(id2)" syntax.
                    if (req.user._id.equals(dish.comments.id(req.params.commentId).author)) {
                        //There is no specific method for updating subdocuments. We have to do this this way.
                        if (req.body.rating) {
                            dish.comments.id(req.params.commentId).rating = req.body.rating;
                        }
                        if (req.body.comment) {
                            dish.comments.id(req.params.commentId).comment = req.body.comment;
                        }
                        dish.save()
                            //Sada vracamo nazad Dish information korisnik-u, ali nakon nalazenja odgovarajuceg "Dish"-a, radimo
                            //Mongoose Population "author" field-a i onda tek vracamo rezultat.
                            .then((dish) => {
                                Dishes.findById(dish._id)
                                    .populate('comments.author')
                                    .then((dish) => {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(dish);
                                    })
                            }, (err) => next(err));
                    } else {
                        var err = new Error("You are not authorized to update this comment! You can only update your own comments.");
                        err.status = 403;
                        return next(err);
                    }
                }
                else if (dish == null) {
                    var err = new Error('Dish ' + req.params.dishId + ' not found');
                    err.status = 404;
                    return next(err);
                }
                else {
                    var err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Dishes.findById(req.params.dishId)
            .then((dish) => {
                if (dish != null && dish.comments.id(req.params.commentId) != null) {
                    //Korisnik moze da obrise komentar samo ako ga je on i napravio. Korisnik ne moze da brise komentare
                    //koji pripadaju drugim korisnicima. Zato upredjujemo "req.user._id" koji "authenticate.verifyUser" dodaje
                    //nakon uspesne autentifikacije, sa poljem "author" iz tog komentara posto polje "author" sadrzi ObjectId
                    //korisnika koji je napravio taj komentar.
                    //ObjectIDs behave like Strings, and hence when comparing two ObjectIDs, you should 
                    //use the "Id1.equals(id2)" syntax.
                    if (req.user._id.equals(dish.comments.id(req.params.commentId).author)) {
                        dish.comments.id(req.params.commentId).remove();
                        dish.save()
                            .then((dish) => {
                                Dishes.findById(dish._id)
                                    .populate('comments.author')
                                    .then((dish) => {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(dish);
                                    })
                            }, (err) => next(err));
                    } else {
                        var err = new Error("You are not authorized to delete this comment! You can only delete your own comments.");
                        err.status = 403;
                        return next(err);
                    }
                }
                else if (dish == null) {
                    var err = new Error('Dish ' + req.params.dishId + ' not found');
                    err.status = 404;
                    return next(err);
                }
                else {
                    var err = new Error('Comment ' + req.params.commentId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

module.exports = dishRouter;