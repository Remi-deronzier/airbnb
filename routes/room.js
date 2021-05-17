const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/User");
const Room = require("../models/Room");
const isAuthenticated = require("../middlewares/isAuthenticated");

// route to publish an ad

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
    if (!name || !price || dates.length === 0) {
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

// route to update an ad

router.put("/rental/update", isAuthenticated, async (req, res) => {
  console.log("route: /rental/update");
  console.log(req.fields);
  try {
    const rental = await Room.findById(req.fields.id);
    if (!rental) {
      res.status(400).json({ message: "this rental doesn't exist" });
    } else {
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
      const reqKeys = Object.keys(req.fields);
      const datesToDelete = Object.values(req.fields).filter(
        (element, index, arr) =>
          Object.keys(req.fields)[index].match(/date-to-delete/)
      );
      const datesToAdd = Object.values(req.fields).filter(
        (element, index, arr) =>
          Object.keys(req.fields)[index].match(/date-to-add/)
      );
      let rentalUpdated = reqKeys.reduce((obj, element) => {
        switch (element) {
          case "name":
            obj.rental_name = name;
            break;
          case "description":
            obj.rental_description = description;
            break;
          case "price":
            obj.rental_price_one_night = price;
            break;
          case "numberBedrooms":
            obj.rental_details[0].NUMBER_BEDROOMS = numberBedrooms;
            break;
          case "wifi":
            obj.rental_details[1].WIFI = wifi;
            break;
          case "kitchen":
            obj.rental_details[2].KITCHEN = kitchen;
            break;
          case "workspace":
            obj.rental_details[3].DEDICATED_WORKSPACE = workspace;
            break;
          case "tv":
            obj.rental_details[4].TV = tv;
            break;
          case "iron":
            obj.rental_details[5].IRON = iron;
            break;
          case "entireHome":
            obj.rental_details[6].ENTIRE_HOME = entireHome;
            break;
          case "selfCheckin":
            obj.rental_details[7].SELF_CHECKIN = selfCheckin;
            break;
          case "hairDryer":
            obj.rental_details[8].HAIR_DRYER = hairDryer;
            break;
        }
        return obj;
      }, rental);
      rentalUpdated = datesToAdd.reduce((obj, element) => {
        // add new dates
        if (obj.rental_dates.indexOf(element) === -1) {
          obj.rental_dates.push(element);
        }
        // obj.rental_dates.push(element);
        return obj;
      }, rentalUpdated);
      rentalUpdated = datesToDelete.reduce((obj, element) => {
        // remove dates
        obj.rental_dates.splice(obj.rental_dates.indexOf(element), 1);
        return obj;
      }, rentalUpdated);
      rentalUpdated.markModified("rental_details"); // update the array in the DBS
      rentalUpdated.markModified("rental_dates"); // update the array in the DBS
      await rentalUpdated.save();
      res.status(200).json({ message: "Rental successfully updated" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route to delete an ad

router.delete("/rental/delete", isAuthenticated, async (req, res) => {
  console.log("route: /rental/delete");
  console.log(req.fields);
  try {
    await Room.findByIdAndDelete(req.fields.id);
    res.status(200).json({ message: "Rental successfully deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route to read an ad

router.get("/rental/:id", async (req, res) => {
  console.log("route: /rental/:id");
  console.log(req.params);
  try {
    const rental = await Room.findById(req.params.id).populate(
      "land_lord",
      "account"
    );
    res.status(400).json(rental);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
