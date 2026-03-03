//Purpose: Connect the database
const mongoose = require("mongoose");

function connectDB(){
  mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
      console.log("Database is connected")
    })
    .catch(err=>{
      console.log("Database connection error")
      process.exit(1);
    })
}
module.exports = connectDB