const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");
const Room = require("../models/Room");
const isAuthenticated = require("../middlewares/isAuthenticated");

// route to publish an ad

router.post("/rental/publish", isAuthenticated, async (req, res) => {
  console.log("route : /room/publish");
  console.log(req.fields);
  console.log(req.files);
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
      location,
    } = req.fields;
    dates = Object.values(req.fields).filter((element, index, arr) =>
      Object.keys(req.fields)[index].match(/date/)
    );
    if (!name || !price || dates.length === 0 || !location) {
      res.status(400).json({
        message:
          "You must specify a name, a price and at least one date for your rental",
      });
    } else {
      const newRoom = new Room({
        rental_name: name,
        rental_description: description,
        rental_price_one_night: price,
        rental_location: location,
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
      const files = req.files; // upload several pictures
      const fileKeys = Object.keys(files);
      if (fileKeys.length !== 0) {
        const promises = fileKeys.map(async (element) => {
          try {
            const picture = await cloudinary.uploader.upload(
              files[element].path,
              {
                folder: `/airbnb/rooms/${newRoom._id}`,
              }
            );
            return picture;
          } catch (error) {
            return res.status(400).json({ message: error.message });
          }
        });
        const pix = await Promise.all(promises);
        newRoom.rental_image = pix;
      }
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
        location,
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
          case "location":
            obj.rental_location = location;
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

// route to delete pictures of an ad

router.delete("/rental/delete-pictures", isAuthenticated, async (req, res) => {
  console.log("route: /rental/delete");
  console.log(req.fields);
  try {
    const reqKeys = Object.keys(req.fields);
    if (reqKeys.length !== 0) {
      const regex = /(?<=airbnb\/rooms\/)\w+(?=\/\w+)/;
      const rental = await Room.findById(req.fields.picture1.match(regex)[0]);
      await cloudinary.api.delete_resources(Object.values(req.fields));
      const picturesToKeep = await rental.rental_image
        .reduce((arr, element, index) => {
          if (Object.values(req.fields).indexOf(element.public_id) === -1) {
            arr.push(index);
          }
          return arr;
        }, [])
        .map((element) => rental.rental_image[element]);
      rental.rental_image = picturesToKeep;
      rental.markModified("rental_image"); // update the array in the DBS
      await rental.save();
    }
    res.status(200).json({ message: "Rental successfully updated!" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route to filter an ad

router.get("/rentals", async (req, res) => {
  console.log("route: /rentals");
  console.log(req.query);
  try {
    let { location, date, limit, page, priceMin, priceMax, sort } = req.query;
    const filter = {};
    if (location) {
      filter.rental_location = new RegExp(location, "i");
    }
    if (date) {
      filter.rental_dates = date;
    }
    if (priceMax) {
      filter.rental_price_one_night = { $lte: Number(priceMax) };
      if (priceMin) {
        filter.rental_price_one_night.$gte = Number(priceMin);
      }
    }
    if (priceMin && !filter.rental_price_one_night) {
      filter.rental_price_one_night = { $gte: Number(priceMin) };
    }
    const sortFilter = {};
    if (sort === "price-desc") {
      sortFilter.rental_price_one_night = "desc";
    }
    if (sort === "price-asc") {
      sortFilter.rental_price_one_night = "asc";
    }
    if (!limit) {
      limit = 3;
    }
    if (!page || page < 1) {
      page = 1;
    }
    const search = await Room.find(filter)
      .sort(sortFilter)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate("land_lord", "account");
    // .select("rental_price_one_night rental_location");
    const count = await Room.countDocuments(filter);
    res.status(200).json({
      count: count,
      rooms: search,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
