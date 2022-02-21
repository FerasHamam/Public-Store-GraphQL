const User = require('../models/User');
const Post = require('../models/Post');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const {clearImage} = require('../util/clean');

module.exports = {
    
    createUser : async function({userInput},req) {
        let errors = [];
        if(!validator.default.isEmail(userInput.email)){
            errors.push({message:'Invalid email!'});
        }
        if(validator.default.isEmpty(userInput.password) || !validator.default.isLength(userInput.password,{min:5}))
        {
            errors.push({message:'Invalid password!'});
        }
        if(errors.length > 0)
        {
            const err = new Error('invalid input!');
            err.data = errors;
            err.status = 422;
            throw err;
        }
        const existedUser = await User.findOne({email:userInput.email});
        if(existedUser)
        {
            const err = new Error('User exists already!');
            throw err;   
        }
        const hashedPassword = await bcrypt.hash(userInput.password , 12);
        user = new User({
            email:userInput.email,
            name:userInput.name,
            password:hashedPassword
        });
        createdUser = await user.save();
        console.log(this.createdUser);
        return {
            ...createdUser._doc, _id: createdUser._id.toString()
        }
    },

    login: async function({email,password},req){
        
        const user = await User.findOne({email:email});
        if(!user){
            const err = new Error('Could not find user!');
            err.status = 401;
            throw err;
        }
        const isCorrect = await bcrypt.compare(password,user.password);
        if(!isCorrect)
        {
            const err = new Error('Password is incorrect!');
            err.status = 401;
            throw err;
        }
        try{
        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        },'someSecret',{expiresIn:"1h"});
        return {
            token: token,
            userId: user._id.toString(),
        }
    }
    catch(err){
        throw err;
    }
    },
    createPost : async function({postInput},req){
        if(!req.isAuth)
        {
        const err = new Error('Not authenticated!');
        err.status = 401;
        throw err;
        }
        let errors = [];
        if(!validator.default.isLength(postInput.title, {min:5}))
        {
            errors.push({message:'Invalid title!'});
        }
        if(!validator.default.isLength(postInput.content, {min:5}))
        {
            errors.push({message:'Invalid content!'});
        }
        if(errors.length > 0)
        {
            const err = new Error('invalid input!');
            err.data = errors;
            err.status = 422;
            throw err;
        }
        const user = await User.findById(req.userId);
        if(!user)
        {
        const err = new Error('User not found!');
        err.status = 401;
        throw err;
        }
        const post = new Post({
            title:postInput.title,
            content:postInput.content,
            imageUrl:postInput.imageUrl,
            creator: user,
        });
        const result = await post.save();
        user.posts.push(result);
        await user.save();
        return {
            ...result._doc, 
            _id: result._id.toString(), 
            createdAt: result.createdAt.toISOString(),
            updatedAt : result.updatedAt.toISOString(),
        };
    },
    posts: async function({page},req){
        if(!req.isAuth){
            const err = new Error('Not authenticated');
            err.status = 401;
            throw err;
        }
        if(!page){
            page = 1;
        }
        postsPerPage =2;
        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find().sort({createdAt: -1}).skip((page-1)*postsPerPage).limit(postsPerPage).populate('creator');
        return {
            totalPosts:totalPosts,
            posts : posts.map(post=>{
                return {
                    ...post._doc,
                    _id:post._id.toString(),
                    createdAt : post.createdAt.toISOString(),
                    updatedAt : post.createdAt.toISOString()
                };
            })
        };
    },
    post: async function({id},req){
        if(!req.isAuth){
            const err = new Error('Not authenticated');
            err.status = 401;
            throw err;
        }
        const post = await Post.findById(id).populate('creator');
        if(!post){
            const err = new Error('Post not found!');
            err.status = 404;
            throw err;
        }
        return {
            ...post._doc,
            _id: post._id.toString(),
            updatedAt: post.createdAt.toISOString() ,
            createdAt: post.createdAt.toISOString()
        }
    },
    updatePost: async function({id,postInput},req){
        if(!req.isAuth){
            const err = new Error('Not authenticated');
            err.status = 401;
            throw err;
        }

        const post = await Post.findById(id).populate('creator');
        if(!post){
            const err = new Error('Post not found!');
            err.status = 404;
            throw err;
        }

        if(post.creator._id.toString() !== req.userId.toString()){
            const err = new Error('Not authorized');
            err.status = 403;
            throw err;
        }

        let errors = [];
        if(!validator.default.isLength(postInput.title, {min:5}))
        {
            errors.push({message:'Invalid title!'});
        }
        if(!validator.default.isLength(postInput.content, {min:5}))
        {
            errors.push({message:'Invalid content!'});
        }
        if(errors.length > 0)
        {
            const err = new Error('invalid input!');
            err.data = errors;
            err.status = 422;
            throw err;
        }

        post.title = postInput.title;
        post.content = postInput.content;
        console.log(postInput.imageUrl);
        if(postInput.imageUrl !== 'undefined'){
            post.imageUrl = postInput.imageUrl;
        }
        const result = await post.save();
        return{
            ...result._doc,
            _id:result._id,
            createdAt : result.createdAt.toISOString(),
            updatedAt : result.updatedAt.toISOString()
        }
    },
    deletePost: async function({id},req){
        if(!req.isAuth){
            const err = new Error('Not authenticated');
            err.status = 401;
            throw err;
        }
        const post = await Post.findById(id);
        if(!post){
            const err = new Error('Post not found!');
            err.status = 404;
            throw err;
        }
        if(post.creator._id.toString() !== req.userId.toString()){
            const err = new Error('Not authorized');
            err.status = 403;
            throw err;
        }
        clearImage(post.imageUrl);
        await Post.findByIdAndRemove(id);
        const user = await User.findById(req.userId);
        user.posts.pull(id);
        await user.save();
        return true;
    },
    user: async function(args,req){
        if(!req.isAuth){
            const err = new Error('Not authenticated');
            err.status = 401;
            throw err;
        }
        const user = await User.findById(req.userId);
        return{
            ...user._doc,
            _id: user._id.toString(),
        }
    },
    updateStatus: async function({status},req){
        if(!req.isAuth){
            const err = new Error('Not authenticated');
            err.status = 401;
            throw err;
        }
        const user = await User.findById(req.userId);
        user.status = status;
        const result = await user.save();
        return{
            ...result._doc,
            _id: result._id.toString(),
        }
    }
}