const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const User = require("../models/User");

// sign_up

router.post("/user/signup", async (req, res) => {
  console.log("route: /signup");
  console.log(req.fields);
  try {
    if (await User.findOne({ email: req.fields.email })) {
      res
        .status(400)
        .json({ message: "This email already exists in the data base" });
    } else if (!req.fields.username) {
      res.status(400).json({ message: "You must specify a username" });
    } else {
      const { email, username, phone, avatar, password } = req.fields;
      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(64);
      const newUser = new User({
        email: email,
        account: {
          username: username,
          phone: phone,
        },
        token: token,
        hash: hash,
        salt: salt,
      });
      await newUser.save();
      res.status(200).json({
        id_: newUser._id,
        token: newUser._id,
        account: newUser.account,
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// login

router.post("/user/login", async (req, res) => {
  console.log("route: /login");
  console.log(req.fields);
  try {
    const user = await User.findOne({ email: req.fields.email });
    if (!user) {
      res.status(400).json({ message: "First, you must register!" });
    } else {
      const { email, password } = req.fields;
      const salt = user.salt;
      const hash = SHA256(password + salt).toString(encBase64);
      if (hash === user.hash) {
        res.status(200).json({
          id_: user._id,
          token: user._id,
          account: user.account,
        });
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
