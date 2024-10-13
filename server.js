const MONGODB_URI =
  "mongodb+srv://stackshamim:jwSbOcmMT4cHZvYZ@mongo-stacker.wakimob.mongodb.net/smart-buy-2?retryWrites=true&w=majority&appName=mongo-stacker";
// dotenv
const dotenv = require('dotenv');
require('dotenv').config();


// server.js or app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./routes/product');
const app = express();


// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(MONGODB_URI).then(() => {
  console.log("Connected to MongoDB");
});

// Routes
app.use('/api/product', productRoutes);


// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
