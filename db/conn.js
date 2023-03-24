const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
.then((res)=>console.log("database connected"))

const userSchema = new mongoose.Schema({
  googleId: String,
  displayName: String,
  email: String,
  // other user information
});

const User = mongoose.model('User', userSchema);
module.exports=User
