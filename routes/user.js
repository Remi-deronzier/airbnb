const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;
const mailgun = require("mailgun-js");

const User = require("../models/User");
const Room = require("../models/Room");
const isAuthenticated = require("../middlewares/isAuthenticated");
const { estimatedDocumentCount } = require("../models/User");
const DOMAIN = process.env.DOMAIN;
const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: DOMAIN,
});

// route signup

router.post("/user/signup", async (req, res) => {
  console.log("route: /signup");
  console.log(req.fields);
  try {
    const { email, username, password, description } = req.fields;
    const usernameExistingDBCheck = await User.find({
      "account.username": username,
    });
    console.log(usernameExistingDBCheck);
    if (await User.findOne({ email: email })) {
      res.status(400).json({
        message: "The email is already taken",
      });
    } else if (usernameExistingDBCheck.length !== 0) {
      res.status(400).json({
        message: "The username is already taken",
      });
    } else if (!(email && password && username && description)) {
      res.status(400).json({ message: "Missing parameters" });
    } else {
      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(64);
      const newUser = new User({
        email: email,
        account: {
          username: username,
          description,
        },
        token: token,
        hash: hash,
        salt: salt,
      });
      await newUser.save();
      res.status(200).json({
        id_: newUser._id,
        token: newUser.token,
        account: newUser.account,
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route to upload a picture for a user

router.put("/user/upload-picture/:id?", isAuthenticated, async (req, res) => {
  console.log("route: /user/upload-picture/:id?");
  console.log(req.params);
  console.log(req.files);
  if (req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      console.log(user);
      if (user) {
        if (String(req.user._id) === String(user._id)) {
          if (req.files.picture) {
            const picture = await cloudinary.uploader.upload(
              req.files.picture.path,
              {
                folder: `/airbnb/users/`,
                public_id: user._id,
              }
            );
            user.account.avatar = picture;
            await user.save();
            res
              .status(200)
              .json(
                await User.findById(req.params.id).select("account email token")
              );
          } else {
            res.status(400).json({ message: "Missing parameters" });
          }
        } else {
          res.status(401).json({ message: "Unauthorized" });
        }
      } else {
        res.status(400).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Missing ID parameter" });
  }
});

// route to delete the avatar of one user

router.delete(
  "/user/delete-picture/:id?",
  isAuthenticated,
  async (req, res) => {
    console.log("route: /user/delete-picture/:id?");
    console.log(req.params);
    if (req.params.id) {
      try {
        const user = await User.findById(req.params.id).select(
          "email account token"
        );
        if (user) {
          if (String(req.user._id) === String(user._id)) {
            if (user.account.avatar) {
              await cloudinary.api.delete_resources([
                user.account.avatar.public_id,
              ]);
              user.account.avatar = null;
              await user.save();
              res.status(200).json(user);
            } else {
              res.status(400).json({ message: "Picture not found" });
            }
          } else {
            res.status(401).json({ message: "Unauthorized" });
          }
        } else {
          res.status(400).json({ message: "User not found" });
        }
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    } else {
      res.status(400).json({ message: "Missing ID parameter" });
    }
  }
);

// route login

router.post("/user/login", async (req, res) => {
  console.log("route: /login");
  console.log(req.fields);
  try {
    const { email, password } = req.fields;
    const user = await User.findOne({ email: email });
    if (!email || !password) {
      res.status(400).json({ message: "Missing parameters" });
    } else if (!user) {
      res.status(401).json({ message: "Unauthorized" });
    } else {
      const salt = user.salt;
      const hash = SHA256(password + salt).toString(encBase64);
      if (hash === user.hash) {
        res.status(200).json({
          id_: user._id,
          token: user.token,
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

// route to get information about one user

router.get("/user/:id", async (req, res) => {
  console.log("route: /user/:id");
  console.log(req.params);
  if (req.params.id) {
    try {
      const user = await User.findById(req.params.id).select("account email");
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(400).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Missing ID parameter" });
  }
});

// route to get information about all users

router.get("/user", async (req, res) => {
  console.log("route: /user");
  try {
    const user = await User.find().select("account email");
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(400).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route to get all ads about one user

router.get("/user/rentals/:id?", async (req, res) => {
  console.log("route: /user/rentals/:id?");
  console.log(req.params);
  if (req.params.id) {
    try {
      const rentalsAgregation = await Room.find().populate(
        "land_lord",
        "account"
      );
      const rentals = rentalsAgregation.filter(
        (element) => String(element.land_lord._id) === String(req.params.id) // Important not to forget the String to compare strings between strings
      );
      res.status(200).json(rentals);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Missing ID paramters" });
  }
});

// route to update information about a user (except pictures & password)

router.put("/user/update", isAuthenticated, async (req, res) => {
  console.log("route: /user/update");
  console.log(req.fields);
  try {
    const user = req.user;
    const { email, username, description } = req.fields;
    if (email || username || description) {
      if (email || username) {
        const emailCkeck = await User.findOne({ email: email });
        const usernameCheck = await User.findOne({
          "account.username": username,
        });
        if (emailCkeck) {
          return res.status(400).json({ message: "Email already exists" });
        } else if (usernameCheck) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      reqKeys = Object.keys(req.fields);
      const userUpdated = reqKeys.reduce((obj, element) => {
        switch (element) {
          case "email":
            obj.email = email;
            break;
          case "username":
            obj.account.username = username;
            break;
          case "description":
            obj.account.description = description;
        }
        return obj;
      }, user);
      await userUpdated.save();
      res.status(200).json({ message: "Profile successfully updated!" });
    } else {
      res.status(400).json({ message: "Missing parameters" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route to delete a user and all his/her ads

router.delete("/user/delete", isAuthenticated, async (req, res) => {
  console.log("route: /user/delete");
  try {
    const user = req.user;
    console.log(user._id);
    const search = await Room.find({
      land_lord: user._id,
    });
    if (search.length !== 0) {
      const picturesToDelete = search
        .map((element) => element.rental_image)
        .reduce((arr, element) => {
          for (let i = 0; i < element.length; i++) {
            arr.push(element[i].public_id);
          }
          return arr;
        }, []);
      if (picturesToDelete.length !== 0) {
        await cloudinary.api.delete_resources(picturesToDelete); // delete all the pictures of the ads in cloudinary
      }
      const idRentalToDelete = search.map((element) => element._id);
      if (idRentalToDelete.length !== 0) {
        idRentalToDelete.forEach(
          async (element) =>
            await cloudinary.api.delete_folder(`/airbnb/rooms/${element}`) // delete all the folders of the ads in cloudinary
        );
      }
      await Room.deleteMany({
        land_lord: user._id, // delete all the ads in mongodb
      });
    }
    await User.findByIdAndDelete(user._id); // delete the user in mongodb
    res.status(200).json({ message: "User successfully deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route to update password

router.put("/user/update-password", isAuthenticated, async (req, res) => {
  console.log("route: /user/update-password");
  console.log(req.fields);
  try {
    const { newPassword, previousPassword } = req.fields;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (newPassword && previousPassword) {
      if (
        SHA256(previousPassword + user.salt).toString(encBase64) === user.hash
      ) {
        if (newPassword !== previousPassword) {
          const salt = uid2(16);
          const hash = SHA256(salt + newPassword).toString(encBase64);
          const token = uid2(64);
          user.token = token;
          user.hash = hash;
          user.salt = salt;
          await user.save();
          const data = {
            from: "Remi <me@sandboxf1775e33cb2d49b9bc361a7ac72cb5c9.mailgun.org>",
            to: "deronzier.remi@gmail.com",
            subject: "Password updated",
            text: "Your password was successfully updated!",
          };
          await mg.messages().send(data);
          res
            .status(200)
            .json(await User.findById(user._id).select("account email token"));
        } else {
          res.status(400).json({ message: "You must change your password!" });
        }
      } else {
        res.status(400).json({ message: "Wrong password" });
      }
    } else {
      res.status(400).json({ message: "Missing parameters" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route to recover one's password

router.put("/user/recover-password", async (req, res) => {
  console.log("route: /user/recover-password");
  console.log(req.fields);
  try {
    const email = req.fields.email;
    if (email) {
      const user = await User.findOne({ email: email });
      if (user) {
        user.temporaryToken = uid2(64);
        user.timestamp = Date.now();
        await user.save();
        const data = {
          from: "Remi <me@sandboxf1775e33cb2d49b9bc361a7ac72cb5c9.mailgun.org>",
          to: "deronzier.remi@gmail.com",
          subject: "Password modification",
          text: `Click on this link to modify your password: https://airbnb/change-password?token=${user.temporaryToken}, You have 15 minutes to change your password!`,
        };
        await mg.messages().send(data);
        res.status(200).json({ message: "A link has been sent to the user" });
      } else {
        res.status(400).json({ message: "User not found" });
      }
    } else {
      res.status(400).json({ message: "Missing parameters" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route to reset the password

router.put("/user/reset-password", async (req, res) => {
  console.log("route: /user/reset-password");
  console.log(req.fields);
  try {
    const { passwordToken, password } = req.fields;
    if (passwordToken && password) {
      const user = await User.findOne({ temporaryToken: passwordToken });
      console.log(user);
      if (user) {
        const date = Date.now();
        const salt = uid2(16);
        if (date - user.timestamp <= 15 * 60 * 1000) {
          user.salt = salt;
          user.hash = SHA256(password + salt).toString(encBase64);
          await user.save();
          res
            .status(200)
            .json(await User.findById(user._id).select("email token"));
        } else {
          res.status(400).json({
            message:
              "You can't change your password anymore, you must start a new procedure!",
          });
        }
      } else {
        res.status(400).json({ message: "User not found" });
      }
    } else {
      res.status(400).json({ message: "Missing parameters" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
