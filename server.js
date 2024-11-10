const dotenv = require('dotenv');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectMongoDB = require('./config/connect_db');
const productRoutes = require('./routes/product');
const userRoutes = require('./routes/user');
const userActionsRoutes = require('./routes/user_actions');
const adminActionsRoutes = require('./routes/admin_actions');
const adminRoutes = require('./routes/admin');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to the database
connectMongoDB();

// Routes
app.use('/api/product', productRoutes);
app.use('/auth/user', userRoutes);
app.use('/auth/admin', adminRoutes);
app.use('/api/user-actions', userActionsRoutes);
app.use('/api/admin-actions', adminActionsRoutes);

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
