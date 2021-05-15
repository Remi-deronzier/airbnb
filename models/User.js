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
  },
  token: String,
  hash: String,
  salt: String,
});

module.exports = User;
