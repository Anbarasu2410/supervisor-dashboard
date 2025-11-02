import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/authRoutes.js';
import companyUserRoutes from './routes/companyUserRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import fleetTaskRoutes from './routes/fleetTaskRoutes.js';
import fleetTaskPassengerRoutes from './routes/fleetTaskPassengerRoutes.js';
import fleetVehicleRoutes from './routes/fleetVehicleRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/company-users', companyUserRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/fleet-tasks', fleetTaskRoutes);
app.use('/api/fleet-task-passengers', fleetTaskPassengerRoutes);
app.use('/api/fleet-vehicles', fleetVehicleRoutes);
app.use('/api/projects', projectRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// MongoDB connection
const dbURI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

mongoose.connect(dbURI, { dbName })
  .then(() => console.log(`✅ Connected to MongoDB database: ${dbName}`))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
