const { body } = require('express-validator');

const createVehicleRules = [
  body('code').trim().notEmpty().withMessage('code is required.'),
  body('plate_number').trim().notEmpty().withMessage('plate_number is required.'),
  body('model').optional().trim(),
  body('status').optional().isIn(['active', 'maintenance', 'out_of_service']),
  body('assigned_driver_id').optional({ nullable: true, checkFalsy: true }).isUUID(),
  body('assigned_rep_id').optional({ nullable: true, checkFalsy: true }).isUUID(),
  body('notes').optional().trim(),
];

const createAssignmentRules = [
  body('vehicle_id').isUUID().withMessage('vehicle_id is required.'),
  body('rep_id').isUUID().withMessage('rep_id is required.'),
  body('driver_id').optional({ nullable: true, checkFalsy: true }).isUUID(),
  body('start_at').optional().isISO8601().withMessage('start_at must be valid datetime.'),
];

module.exports = {
  createVehicleRules,
  createAssignmentRules,
};
