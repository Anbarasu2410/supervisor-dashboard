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
import workerRoutes from './routes/workerRoutes.js'; 
import attendanceRoutes from'./routes/attendanceRoutes.js';
import supervisorRoutes from './routes/supervisorRoutes.js'
//  import supervisorReviewRoutes from "./routes/supervisorReviewRoutes.js";
import supervisorDailyProgressRoutes  from "./routes/supervisorDailyProgressRoutes.js"

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased for file uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve uploaded files statically - THIS IS CRITICAL FOR PHOTO PREVIEWS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log static file requests for debugging
app.use('/uploads', (req, res, next) => {
  console.log(`📁 Static file request: ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/company-users', companyUserRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/fleet-tasks', fleetTaskRoutes);
app.use('/api/fleet-task-passengers', fleetTaskPassengerRoutes);
app.use('/api/fleet-vehicles', fleetVehicleRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/supervisor', supervisorRoutes);
// app.use("/api/supervisor-review", supervisorReviewRoutes);
app.use('/api/supervisor', supervisorDailyProgressRoutes);




// Enhanced health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5001,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test static file route
app.get('/api/test-upload', (req, res) => {
  res.json({
    success: true,
    message: 'Static file serving test',
    uploadsPath: path.join(__dirname, 'uploads'),
    staticRoute: '/uploads'
  });
});

// MongoDB connection
const dbURI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

mongoose.connect(dbURI, { 
  dbName,
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log(`✅ Connected to MongoDB database: ${dbName}`))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads/`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🖼️  Photo uploads will be served from: http://localhost:${PORT}/uploads/tasks/`);
});