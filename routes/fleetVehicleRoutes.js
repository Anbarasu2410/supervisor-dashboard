const express = require('express');
const router = express.Router();
const {
  createFleetVehicle,
  getFleetVehicles,
  getFleetVehicleById,
  getFleetVehiclesByCompany,
  getFleetVehiclesByStatus,
  updateFleetVehicle,
  deleteFleetVehicle
} = require('../controllers/fleetVehicleController');

// Make sure all these functions are exported from your controller
router.post('/', createFleetVehicle);
router.get('/', getFleetVehicles);
router.get('/:id', getFleetVehicleById);
router.get('/company/:companyId', getFleetVehiclesByCompany);
router.get('/status/:status', getFleetVehiclesByStatus);
router.put('/:id', updateFleetVehicle);
router.delete('/:id', deleteFleetVehicle);

module.exports = router;