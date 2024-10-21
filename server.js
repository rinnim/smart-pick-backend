const dotenv = require('dotenv');
require('dotenv').config();


// server.js or app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./routes/product');
const userRoutes = require('./routes/user');
const userActionsRoutes = require('./routes/user_actions');
const app = express();


// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("Connected to MongoDB");
});

// Routes
app.use('/api/product', productRoutes);
app.use('/auth/user', userRoutes);
app.use('/api/user-actions',userActionsRoutes);

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
