const mongoose = require('mongoose');

const connentDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
    }catch(err){
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }  
}

module.exports = connentDB;