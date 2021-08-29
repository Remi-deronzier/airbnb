const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: {
    unique: true,
    type: String,
  },
  account: {
    username: {
      required: true,
      type: String,
    },
    phone: String,
    avatar: Object, // to upload a picture
    description: String,
  },
  token: String,
  hash: String,
  salt: String,
  temporaryToken: String,
  timestamp: Number,
});

module.exports = User;
