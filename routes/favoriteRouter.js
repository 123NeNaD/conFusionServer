const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const cors = require('./cors');

const Dishes = require('../models/dishes');
const Favorites = require('../models/favorites');

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/fav')
    .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then((favorites) => {
                console.log(favorites);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err))
            .catch((err) => next(err));

    });

favoriteRouter.route('/')
    .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then((favorites) => {
                if (favorites != null) {
                    Favorites.findOne({ user: req.user._id })
                        .populate('dishes')
                        .populate('user')
                        .then((favorites) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorites);
                        }, (err) => next(err))
                        .catch((err) => next(err));
                }
                else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites/');
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then((favorites) => {
                if (favorites != null) {
                    req.body.forEach(function MyFunction(dish) {
                        if (favorites.dishes.indexOf(dish._id) == -1) {
                            favorites.dishes.push(dish._id);
                        }
                    });
                    favorites.save()
                        .then((favorites) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorites);
                        }, (err) => next(err));
                }
                else {
                    favorites = new Favorites({ user: req.user._id });
                    req.body.forEach(function MyFunction(dish) {
                        if (favorites.dishes.indexOf(dish._id) == -1) {
                            favorites.dishes.push(dish._id);
                        }
                        else {
                            var err = new Error('You already have the ' + dish._id + ' dish in your favorites list!');
                            return next(err);
                        }
                    });
                    favorites.save()
                        .then((favorites) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorites);
                        }, (err) => next(err));
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.deleteOne({ user: req.user._id })
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp);
            }, (err) => next(err))
            .catch((err) => next(err));
    });

favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) => { res.sendStatus(200); })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then((favorites) => {
                if (!favorites) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    return res.json({ "exists": false, "favorites": favorites });
                }
                else {
                    if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        return res.json({ "exists": false, "favorites": favorites });
                    }
                    else {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        return res.json({ "exists": true, "favorites": favorites });
                    }
                }

            }, (err) => next(err))
            .catch((err) => next(err))
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites/' + req.params.dishId);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then((favorites) => {
                if (favorites != null) {
                    if (favorites.dishes.indexOf(req.params.dishId) == -1) {
                        favorites.dishes.push(req.params.dishId);
                        favorites.save()
                            .then((favorites) => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorites);
                            }, (err) => next(err));
                    }
                    else {
                        var err = new Error('You already have the ' + req.params.dishId + ' dish in your favorites list!');
                        return next(err);
                    }
                }
                else {
                    favorites = new Favorites({ user: req.user._id });
                    favorites.dishes.push(req.params.dishId);
                    favorites.save()
                        .then((favorites) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorites);
                        }, (err) => next(err));
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then((favorites) => {
                if (favorites != null) {
                    if (favorites.dishes.length == 0) {
                        var err = new Error('Your favorite list is already empty and there is nothing to be removed!');
                        err.status = 404;
                        return next(err);
                    }
                    else {
                        if (favorites.dishes.indexOf(req.params.dishId) == -1) {
                            var err = new Error('The dish ' + req.params.dishId + ' is not in your favorite list, so you can not remove it from the list!');
                            return next(err);
                        }
                        else {
                            var index = favorites.dishes.indexOf(req.params.dishId);
                            if (index > -1) {
                                favorites.dishes.splice(index, 1);
                                favorites.save()
                                    .then((favorites) => {
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(favorites);
                                    }, (err) => next(err));
                            }
                        }
                    }
                }
                else {
                    var err = new Error('Your favorite list is already empty and there is nothing to be removed!');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

module.exports = favoriteRouter;