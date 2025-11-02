// backend/index.js or backend/app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();


// Middleware
app.use(cors());
app.use(express.json());
const path = require('path');
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/company-users', require('./routes/companyUserRoutes'));
app.use('/api/driver', require('./routes/driverRoutes')); // Add this line
app.use('/api/fleet-tasks', require('./routes/fleetTaskRoutes'));
app.use('/api/fleet-task-passengers', require('./routes/fleetTaskPassengerRoutes'));
app.use('/api/fleet-vehicles', require('./routes/fleetVehicleRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
//app.use('/api', require('./routes/profileRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString() 
  });
});
const dbURI = process.env.MONGODB_URI ;
const dbName = process.env.DB_NAME ;

mongoose.connect(dbURI, { dbName })
  .then(() => console.log(`✅ Connected to MongoDB database: ${dbName}`))
  .catch(err => console.error('❌ MongoDB connection error:', err));
// MongoDB connection

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});