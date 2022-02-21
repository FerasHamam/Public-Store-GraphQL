const path = require('path');
const fs = require('fs');

const clearImage = (imagePath)=>{
    imagePath = path.join(__dirname , '..' , imagePath);
    fs.unlink(imagePath,err=>console.log(err));
};

exports.clearImage = clearImage;