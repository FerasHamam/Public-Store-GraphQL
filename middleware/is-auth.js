const jwt = require('jsonwebtoken');

module.exports = (req,res,next)=>{
    const auth = req.get('Authorization');
    if(!auth)
    {
        req.isAuth=false;
        return next();
    }
    const token = auth.split(' ')[1];
    let decodeToken;
    try{
        decodeToken = jwt.verify(token,'someSecret');
    }
    catch(err){
        req.isAuth=false;
        return next()
    }
    if(!decodeToken)
    {
        req.isAuth=false;
        return next()
    }
    req.isAuth=true;
    req.userId = decodeToken.userId;
    return next();
}