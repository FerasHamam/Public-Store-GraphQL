const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const {graphqlHTTP} = require('express-graphql');
const resolvers = require('./graphql/resolvers');
const schema = require('./graphql/schema');
const auth = require('./middleware/is-auth');

//db
const mongoose = require('mongoose');
const uri = 'uri';
//
const app = express();
//files
const path = require('path');
const multer = require('multer');
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'images');
    },
    filename:  (req, file, cb)=>{
            cb(null, uuidv4());
    }
  });
const fileFilter = (req,file,cb)=>{
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg')
    {
        cb(null,true);
    }
    else 
    {
        cb(null,false);
    }
}
//


app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if(req.method === 'OPTIONS'){
        return res.sendStatus(200);
    }
    next();
});

app.use(bodyParser.json());

app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image'));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(auth);

app.put('/post-image',(req,res,next)=>{
    if(!req.isAuth){
       const err = new Error('not authenticated');
       err.status = 401;
       throw err;
    }
    if(!req.file){
        return res.status(200).json({
            message:'no file provided!'
        })
    }
    console.log(req.file.path.replace("\\" ,"/"));
    return res.status(201).json({
        message:'file stored',
        imagePath: req.file.path.replace("\\" ,"/"),
    })
});

app.use(graphqlHTTP({
    schema:schema,
    rootValue:resolvers,
    graphiql:true,
    formatError(err){
        if(!err.originalError)
        {
            return err;
        }
        return {
            message:err.message,
            status : err.originalError.status||500,
            data : err.originalError.data
        }
    }
}));

app.use((error,req,res,next)=>{
    console.log(error);
    const status = error.statusCode || 500;
    const msg = error.message;
    res.status(status).json(
        {
            message: msg,
        }
    );
});

mongoose.connect(uri)
.then(result=>{
    app.listen(8080);
})
.catch(err=>{
   console.log(err);
});

