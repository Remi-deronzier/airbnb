// Initialization
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary");
require("dotenv").config();

const app = express();
app.use(formidable());

// Connection with the DB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Importation of routes
const userRoutes = require("./routes/user");
app.use(userRoutes);
const userRoom = require("./routes/room");
app.use(userRoom);

// Launching of the server
app.all("*", (req, res) => {
  res.status(404).json({ message: "Page not found" });
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});
