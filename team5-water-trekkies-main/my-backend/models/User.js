const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },  // Change FullName to name
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('users', userSchema);

module.exports = User;
