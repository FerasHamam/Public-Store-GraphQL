const bcrtypt = require('bcryptjs');
const {validationResult} = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');


exports.signUp = (req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        let err = new Error('Valdiation failed!');
        err.statusCode = 422;
        err.data = errors.array();
        throw err;
    }
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    bcrtypt.hash(password,12).then(hashedPassword=>{
        const user = new User({
            name:name,
            email:email,
            password : hashedPassword,
        });
        return user.save();
    }).then(result=>{
        res.status(201).json({
            message:'user created successfully',
            userId: result._id
        });
    }).catch(err=>{
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
}

exports.login = (req,res,next)=>{
    const email = req.body.email;
    const password = req.body.password
    let loadedUser;
    User.findOne({email:email}).then(user=>{
        if(!user){
            const err = new Error('Email does not exist!');
            err.statusCode = 422;
            throw err;
        }
        loadedUser = user;
        return bcrtypt.compare(password,user.password);
    }).then(isEqual => {
        if(!isEqual)
        {
            const err = new Error('Invalid Password!');
            err.statusCode = 422;
            throw err;
        }
        const token = jwt.sign({
            email:email,
            userId: loadedUser._id.toString()
        },
        'supersecret',
        {
            expiresIn: '1h'
        }
        );
        res.status(200).json({
            message:'Login succeeded',
            userId: loadedUser._id.toString(),
            token : token
        })
    }).catch(err=>{
        if(!err.statusCode)
        {
            err.statusCode = 500;
        }
        next(err);
    })
}