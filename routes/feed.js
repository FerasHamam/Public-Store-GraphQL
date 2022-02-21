const express = require('express');
const {body} = require('express-validator');
const router = express.Router();
const isAuth = require('../middleware/is-auth');
const feed = require('../controllers/feed');

router.get('/posts',isAuth,feed.getPosts);

router.post(
    '/post'
    ,isAuth
    ,[
    body('title').isLength({min:5}),
    body('content').isLength({min:5})
    ]
    ,feed.createPost
);

router.get('/post/:postId', isAuth, feed.getPost);

router.put(
    '/post/:postId',
    isAuth ,
[
    body('title').isLength({min:5}),
    body('content').isLength({min:5})
],
    feed.updatePost);

router.delete('/post/:postId', isAuth, feed.deletePost);

module.exports = router;