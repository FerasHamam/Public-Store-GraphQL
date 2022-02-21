const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const authController = require('../controllers/auth');
const User = require('../models/User');

router.put('/signup',[
    body('email').isEmail().withMessage('Please enter a valid email!').custom((value,{req})=>{
        return User.findOne({email:value}).then(user=>{
            if(user)
            {
                return Promise.reject('Email already exists!');
            }
            return true;
        });
    }),
    body('password').trim().isLength({min:5}),
    body('name').trim().not().isEmpty()
],authController.signUp);

router.post('/login',authController.login);

module.exports = router;