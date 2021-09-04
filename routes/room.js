const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");
const Room = require("../models/Room");
const isAuthenticated = require("../middlewares/isAuthenticated");

// route to publish an ad (except pictures)

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
      location,
      reviews,
      ratingValue,
      locationGps,
    } = req.fields;
    const {
      locationGps: { lat, long },
    } = req.fields;
    dates = Object.values(req.fields).filter((element, index, arr) =>
      Object.keys(req.fields)[index].match(/date/)
    );
    if (
      !name ||
      !price ||
      dates.length === 0 ||
      !location ||
      !reviews ||
      !locationGps ||
      !ratingValue
    ) {
      res.status(400).json({
        message:
          "You must specify a name, a price, a location, the GPS coordinates, the number of reviews, the rate and at least one date for your rental",
      });
    } else {
      const newRoom = new Room({
        rental_name: name,
        rental_description: description,
        rental_price_one_night: price,
        rental_location: location,
        rental_gps_location: [long, lat],
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
        rental_reviews: reviews,
        rental_rating_value: ratingValue,
      });
      await newRoom.save();
      res.status(200).json(newRoom);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route to upload pictures for a rental

router.put("/rental/upload-picture/:id?", isAuthenticated, async (req, res) => {
  console.log("route: /rental/upload-picture/:id?");
  console.log(req.params);
  console.log(req.files);
  if (req.params.id) {
    try {
      const rental = await Room.findById(req.params.id);
      if (rental) {
        if (String(req.user._id) === String(rental.land_lord._id)) {
          const files = req.files; // upload several pictures
          const fileKeys = Object.keys(files);
          if (fileKeys.length !== 0) {
            if (Object.keys(rental.rental_image).length === 0) {
              // case when no picture has been uploaded yet
              if (fileKeys.length <= 5) {
                // prevent user from uploading more than 5 pictures
                const promises = fileKeys.map(async (element) => {
                  try {
                    const picture = await cloudinary.uploader.upload(
                      files[element].path,
                      {
                        folder: `/airbnb/rooms/${rental._id}`,
                      }
                    );
                    return picture;
                  } catch (error) {
                    return res.status(400).json({ message: error.message });
                  }
                });
                const pix = await Promise.all(promises);
                console.log(Object.keys(rental.rental_image));
                console.log(rental.rental_image);
                rental.rental_image = pix;
                await rental.save();
                res.status(200).json(rental);
              } else {
                res
                  .status(400)
                  .json({ message: "You can't upload more than 5 pictures" });
              }
            } else {
              // case when some pictures already exist in the DB
              if (fileKeys.length + rental.rental_image.length <= 5) {
                // prevent user from uploading more than 5 pictures
                const promises = fileKeys.map(async (element) => {
                  try {
                    const picture = await cloudinary.uploader.upload(
                      files[element].path,
                      {
                        folder: `/airbnb/rooms/${rental._id}`,
                      }
                    );
                    return picture;
                  } catch (error) {
                    return res.status(400).json({ message: error.message });
                  }
                });
                const pix = await Promise.all(promises);
                console.log(Object.keys(rental.rental_image));
                console.log(rental.rental_image);
                await rental.rental_image.push(...pix);
                rental.markModified("rental_image"); // update the array in the DBS
                await rental.save();
                res.status(200).json(rental);
              } else {
                res
                  .status(400)
                  .json({ message: "You can't upload more than 5 pictures" });
              }
            }
          } else {
            res.status(400).json({ message: "Missing parameters" });
          }
        } else {
          res.status(401).json({ message: "Unauthorized" });
        }
      } else {
        res.status(400).json({ message: "Rental not found" });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Missing ID parameter" });
  }
});

// route to delete one picture from an ad

router.delete(
  "/rental/delete-picture/:id?",
  isAuthenticated,
  async (req, res) => {
    console.log("router: /rental/delete-picture/:id?");
    console.log(req.params);
    console.log(req.fields);
    if (req.params.id) {
      try {
        const rental = await Room.findById(req.params.id);
        if (rental) {
          if (String(req.user._id) === String(rental.land_lord._id)) {
            if (req.fields.picture_id) {
              const index = rental.rental_image.reduce((arr, element, ind) => {
                if (
                  element.public_id ===
                  `airbnb/rooms/${req.params.id}/${req.fields.picture_id}`
                ) {
                  arr.push(ind);
                }
                return arr;
              }, [])[0];
              console.log(index);
              if (typeof index === "number") {
                await cloudinary.api.delete_resources([
                  rental.rental_image[index].public_id,
                ]);
                rental.rental_image.splice(index, 1);
                rental.markModified("rental_image"); // update the array in the DBS
                await rental.save();
                res
                  .status(200)
                  .json({ message: "Picture successfully deleted!" });
              } else {
                res.status(400).json({ message: "Picture not found" });
              }
            } else {
              res.status(400).json({ message: "Missing parameters" });
            }
          } else {
            res.status(401).json({ message: "Unauthorized" });
          }
        } else {
          res.status(400).json({ message: "Rental not found" });
        }
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    } else {
      res.status(400).json({ message: "Missing ID parameter" });
    }
  }
);

// route to update an ad (except pictures)

router.put("/rental/update/:id?", isAuthenticated, async (req, res) => {
  console.log("route: /rental/update");
  console.log(req.fields);
  console.log(req.params);
  if (req.params.id) {
    try {
      const rental = await Room.findById(req.params.id);
      if (!rental) {
        res.status(400).json({ message: "this rental doesn't exist" });
      } else {
        if (String(req.user._id) === String(rental.land_lord._id)) {
          // check that the token match with the owner of the ad
          let lat, long;
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
            reviews,
            ratingValue,
          } = req.fields;
          if (req.fields.locationGps) {
            lat = req.fields.locationGps.lat;
            long = req.fields.locationGps.long;
          }
          if (
            !name &&
            !description &&
            !price &&
            !numberBedrooms &&
            !wifi &&
            !kitchen &&
            !workspace &&
            !tv &&
            !iron &&
            !entireHome &&
            !selfCheckin &&
            !hairDryer &&
            !location &&
            !reviews &&
            !ratingValue &&
            !lat &&
            !long // check that at least one modification of the ad has been specified by the user
          ) {
            res.status(400).json({ message: "Missing parameters" });
          } else {
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
                case "locationGps":
                  obj.rental_gps_location = [long, lat];
                  break;
                case "ratingValue":
                  obj.rental_rating_value = ratingValue;
                  break;
                case "reviews":
                  obj.rental_reviews = reviews;
                  break;
              }
              return obj;
            }, rental);
            rentalUpdated = datesToAdd.reduce((obj, element) => {
              // add new dates
              if (obj.rental_dates.indexOf(element) === -1) {
                obj.rental_dates.push(element);
              }
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
        } else {
          res.status(401).json({ message: "Unauthorized" });
        }
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Missing ID parameter" });
  }
});

// route to delete an ad

router.delete("/rental/delete/:id?", isAuthenticated, async (req, res) => {
  console.log("route: /rental/delete");
  console.log(req.params);
  if (req.params.id) {
    try {
      const rental = await Room.findById(req.params.id);
      if (rental) {
        if (String(req.user._id) === String(rental.land_lord._id)) {
          // check that the token match with the owner of the ad
          console.log(Object.keys(rental.rental_image).length);
          if (Object.keys(rental.rental_image).length !== 0) {
            const picturesToDelete = rental.rental_image.map(
              (element) => element.public_id
            );
            await cloudinary.api.delete_resources(picturesToDelete);
          }
          await cloudinary.api.delete_folder(`/airbnb/rooms/${rental._id}`);
          await Room.findByIdAndDelete(req.params.id);
          res.status(200).json({ message: "Rental successfully deleted" });
        } else {
          res.status(401).json({ message: "Unauthorized" });
        }
      } else {
        res.status(400).json({ message: "Rental not found" });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Missing ID parameter" });
  }
});

// route to read an ad

router.get("/rental/:id", async (req, res) => {
  console.log("route: /rental/:id");
  console.log(req.params);
  if (req.params.id) {
    try {
      const rental = await Room.findById(req.params.id).populate(
        "land_lord",
        "account"
      );
      if (rental) {
        res.status(200).json(rental);
      } else {
        res.status(400).json({ message: "Rental not found" });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: "Missing ID parameter" });
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
      limit = 20;
    }
    if (!page || page < 1) {
      page = 1;
    }
    const maxReturnedRentals = 20;
    if (
      Object.keys(filter).length !== 0 ||
      Object.keys(sortFilter).length !== 0
    ) {
      const search = await Room.find(filter)
        .sort(sortFilter)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate("land_lord");
      const count = await Room.countDocuments(filter);
      res.status(200).json({
        count: count,
        rooms: search,
      });
    } else if (
      Object.keys(filter).length === 0 &&
      Object.keys(sortFilter).length === 0 &&
      (await Room.countDocuments()) <= maxReturnedRentals
    ) {
      const count = await Room.countDocuments();
      const rentals = await Room.find().populate("land_lord");
      res.status(200).json({
        count: count,
        rooms: rentals,
      });
    } else {
      const rentals = await Room.find().populate("land_lord");
      const numberRentals = await Room.countDocuments();
      let randomNumber = Math.floor(Math.random() * numberRentals);
      const arrayOfRandomNumbers = [];
      for (let i = 0; i < maxReturnedRentals; i++) {
        while (arrayOfRandomNumbers.indexOf(randomNumber) !== -1) {
          randomNumber = Math.floor(Math.random() * numberRentals);
        }
        arrayOfRandomNumbers.push(randomNumber);
        randomNumber = Math.floor(Math.random() * numberRentals);
      }
      const rentalsResult = rentals.filter(
        (element, index) => arrayOfRandomNumbers.indexOf(index) !== -1
      );
      res.status(200).json({
        count: maxReturnedRentals,
        rooms: rentalsResult,
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route to find rentals around

router.get("/rentals/around", async (req, res) => {
  console.log("route: /rentals/around");
  console.log(req.query);
  try {
    const { longitude, latitude } = req.query;
    if (longitude && latitude) {
      const rentals = await Room.find({
        rental_gps_location: {
          $near: [longitude, latitude],
          $maxDistance: 0.1,
        },
      });
      res.status(200).json(rentals);
    } else {
      res.status(200).json({ message: "Missing parameters" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
