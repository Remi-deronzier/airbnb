const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");
const Room = require("../models/Room");
const isAuthenticated = require("../middlewares/isAuthenticated");

// route signup

router.post("/user/signup", async (req, res) => {
  console.log("route: /signup");
  console.log(req.fields);
  try {
    const { email, username, phone, password } = req.fields;
    const usernameExistingDBCheck = await User.find({
      account: { username: username },
    });
    // console.log(usernameExistingDBCheck.length);
    if (await User.findOne({ email: email })) {
      res.status(400).json({
        message: "The email is already taken",
      });
    } else if (usernameExistingDBCheck.length !== 0) {
      res.status(400).json({
        message: "The username is already taken",
      });
    } else if (!(email && password && username && phone)) {
      res.status(400).json({ message: "Missing parameters" });
    } else {
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
        token: newUser.token,
        account: newUser.account,
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route to upload a picture for a user

router.put("/user/upload-picture/:id", isAuthenticated, async (req, res) => {
  console.log("route: /user/upload-picture/:id");
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

router.delete("/user/delete-picture/:id", isAuthenticated, async (req, res) => {
  console.log("route: /user/delete-picture/:id");
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
});

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

// route to get information abour one user

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

// route to get all ads about one user

router.get("/user/rentals/:id", async (req, res) => {
  console.log("route: /user/rentals/:id");
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

// route to update information about a user

router.put("/user/update", isAuthenticated, async (req, res) => {
  console.log("route: /user/update");
  console.log(req.fields);
  console.log(req.files);
  try {
    const user = await User.findById(req.fields.id);
    console.log(user);
    if (!user) {
      res.status(400).json({ message: "The ID is not correct" });
    } else {
      if (Object.keys(req.files).length !== 0) {
        if (user.account.avatar) {
          await cloudinary.api.delete_resources([
            user.account.avatar.public_id,
          ]);
        }
        const newPicture = await cloudinary.uploader.upload(
          req.files.picture.path,
          {
            folder: `/airbnb/users/`,
            public_id: user._id,
          }
        );
        user.account.avatar = newPicture;
      }
      const { email, username, phone } = req.fields;
      reqKeys = Object.keys(req.fields);
      const userUpdated = reqKeys.reduce((obj, element) => {
        switch (element) {
          case "email":
            obj.email = email;
            break;
          case "username":
            obj.account.username = username;
            break;
          case "phone":
            obj.account.phone = phone;
        }
        return obj;
      }, user);
      await userUpdated.save();
    }
    res.status(400).json({ message: "Profile successfully updated!" });
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
    const picturesToDelete = search
      .map((element) => element.rental_image)
      .reduce((arr, element) => {
        for (let i = 0; i < element.length; i++) {
          arr.push(element[i].public_id);
        }
        return arr;
      }, []);
    console.log(search);
    console.log(picturesToDelete);
    const idRentalToDelete = search.map((element) => element._id);
    await cloudinary.api.delete_resources(picturesToDelete); // delete all the pictures of the ads in cloudinary
    idRentalToDelete.forEach(
      async (element) =>
        await cloudinary.api.delete_folder(`/airbnb/rooms/${element}`) // delete all the folders of the ads in cloudinary
    );
    await User.findByIdAndDelete(user._id); // delete the user in mongodb
    await Room.deleteMany({
      land_lord: user._id, // delete all the ads in mongodb
    });
    res.status(200).json({ message: "User successfully deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
