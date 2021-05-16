const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/User");
const Room = require("../models/Room");
const isAuthenticated = require("../middlewares/isAuthenticated");

router.post("/rental/publish", isAuthenticated, async (req, res) => {
  console.log("route : /room/publish");
  console.log(req.fields);
  try {
    const {
      name,
      description,
      price,
      numberBedrooms,
      wifi,
      kitchen,
      workspace,
      tv,
      iron,
      entireHome,
      selfCheckin,
      hairDryer,
    } = req.fields;
    dates = Object.values(req.fields).filter((element, index, arr) =>
      Object.keys(req.fields)[index].match(/date/)
    );
    // console.log(dates); // good
    if (!name && !price && dates.length === 0) {
      res.status(400).json({
        message:
          "You must specify a name, a price and at least one date for your rental",
      });
    } else {
      const newRoom = new Room({
        rental_name: name,
        rental_description: description,
        rental_price_one_night: price,
        rental_details: [
          { NUMBER_BEDROOMS: numberBedrooms },
          { WIFI: wifi },
          { KITCHEN: kitchen },
          { DEDICATED_WORKSPACE: workspace },
          { TV: tv },
          { IRON: iron },
          { ENTIRE_HOME: entireHome },
          { SELF_CHECKIN: selfCheckin },
          { HAIR_DRYER: hairDryer },
        ],
        rental_dates: dates,
        land_lord: req.user,
      });
      await newRoom.save();
      res.status(200).json(newRoom);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
