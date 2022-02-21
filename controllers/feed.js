const Post = require('../models/Post');
const {validationResult} = require('express-validator');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const io = require('../socket');

exports.getPosts = async(req,res,next)=>{
    try{
    const page = req.query.page;
    let totalItems ;
    const perPage = 2;
    let count =  await Post.find().countDocuments();
    totalItems = count;
    let posts = await Post.find().populate('creator').sort({createdAt:-1})
        .skip((page-1) * perPage).limit(perPage);

    res.status(200).json({
        message:'fetched successfully',
        posts:posts,
        totalItems: totalItems,
    });
}
catch (err){
    if(!err.statusCode)
    {
        err.statusCode = 422;
    }
    next(err);
}}

exports.getPost = async (req,res,next)=>{
    try
    {
    const postId = req.params.postId;
    let post  = await Post.findById(postId)
    if(!post){
        const err = new Error('Could not fetch post!');
        err.statusCode = 422;
        throw err;
     }
    res.status(200).json({
        message:'fetched post successfully!',
        post: post,
    });
}
    catch (err){
        if(!err.statusCode)
        {
            err.statusCode = 422;
        }
        next(err);
    }
}

exports.createPost = async (req,res,next)=>{
    try
    {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const err =  new Error('validation failed!');
        err.statusCode = 422;
        throw err;
    }
    if(!req.file)
    {   
        const err = new Error('image is not provided!');
        err.statusCode = 422;
        throw err;
    }
    let creator;
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path.replace("\\" ,"/");
    const post  = new Post({
        title : title,
        content:content,
        creator:req.userId,
        imageUrl: imageUrl,
    });
    let result = await post.save();
    let user = await User.findById(req.userId);
    creator = user;
    user.posts.push(post);
    result = await user.save();
    io.getIo().emit('posts',{
        post:{...post._doc , creator:{_id : req.userId, name: user.name}},
        action:'Create'
    })
    res.status(201).json({
        message : 'Post created Successfully',
        post:post,
        creator:{_id:creator._id, name:creator.name},
    });}
    
    catch(err){
        if(!err.statusCode)
        {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.updatePost = async function(req,res,next){
    const errors = validationResult(req);
    if(!errors.isEmpty())
    {
        const err = new Error('Could not update post due to validation error!');
        err.statusCode = 422;
        throw err;
    }
    try{
    postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if(req.file)
    {   
        imageUrl = req.file.path.replace("\\" ,"/");
    }
    if(!imageUrl)
    {
        const err = new Error('no image is provided!');
        err.statusCode = 422;
        throw err;
    }
    const post = await Post.findById(postId).populate('creator');
    if(!post)
    {
        const err = new Error('could not find post to update!');
        err.statusCode = 422;
        throw err;
    }
    if(req.userId !== post.creator._id.toString())
    {   
        if(post.imageUrl !== imageUrl)
        {
        clearImage(imageUrl);
        }
        const err = new Error('Not Authorized!');
        err.statusCode = 403;
        throw err;
    }
    if(post.imageUrl !== imageUrl)
    {
        clearImage(post.imageUrl);
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    const result =  await post.save();
    io.getIo().emit('posts',{action:'Update', post:post});
    res.status(200).json({
        message:'Post updated successfully',
        post : post,
    });
    }
    catch(err){
        if(!err.statusCode)
        {
            err.statusCode = 500;
        }
        next(err);
    }
}


exports.deletePost = async (req,res,next)=>{
    try{
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    if(req.userId !== post.creator._id.toString())
    {   
        const err = new Error('Not Authorized!');
        err.statusCode = 403;
        throw err;
    }
    await clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    io.getIo().emit('posts',{action:'Delete', post:postId});
    res.status(200).json({
        'message':'deleted Succesfully!',
    });
}
catch(err){
        if(!err.statusCode)
        {
            err.statusCode = 500;
        }
        next(err);
    }
};


const clearImage = (imagePath)=>{
    imagePath = path.join(__dirname , '..' , imagePath);
    fs.unlink(imagePath,err=>console.log(err));
};