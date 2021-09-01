const mongoose = require("mongoose");

const Room = mongoose.model("Room", {
  rental_name: {
    type: String,
    maxLength: 50,
  },
  rental_description: {
    type: String,
    maxLength: 500,
  },
  rental_price_one_night: {
    type: Number,
    max: 100000,
  },
  rental_location: String,
  rental_gps_location: Array,
  rental_details: Array,
  //   [
  //     {NUMBER_BEDROOMS: 4},
  //     {WIFI: "YES"/"NO"},
  //     {KITCHEN: "YES"/"NO"},
  //     {DEDICATED_WORKSPACE: "YES"/"NO"},
  //     {TV: "YES"/"NO"},
  //     {IRON: "YES"/"NO"},
  //     {ENTIRE_HOME: "YES"/"NO"},
  //     {SELF_CHECKIN: "YES"/"NO"},
  //     {HAIR_DRYER: "YES"/"NO"},
  // ]
  rental_image: { type: mongoose.Schema.Types.Mixed, default: {} },
  land_lord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  rental_dates: {
    required: true,
    type: Array, // The dates are strings and stored in an array
  },
  rental_reviews: Number,
  rental_rating_value: Number,
});

module.exports = Room;
