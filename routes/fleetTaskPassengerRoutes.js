const express = require('express');
const router = express.Router();
const {
  createFleetTaskPassenger,
  getFleetTaskPassengers,
  getFleetTaskPassengerById,
  getFleetTaskPassengersByTaskId,
  getFleetTaskPassengersByCompany,
  updateFleetTaskPassenger,
  deleteFleetTaskPassenger
} = require('../controllers/fleetTaskPassengerController');

router.post('/', createFleetTaskPassenger);
router.get('/', getFleetTaskPassengers);
router.get('/:id', getFleetTaskPassengerById);
router.get('/task/:taskId', getFleetTaskPassengersByTaskId);
router.get('/company/:companyId', getFleetTaskPassengersByCompany);
router.get('/task/:taskId', getFleetTaskPassengersByTaskId);
router.put('/:id', updateFleetTaskPassenger);
router.delete('/:id', deleteFleetTaskPassenger);

module.exports = router;