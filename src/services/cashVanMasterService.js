const { CashVanVehicle, CashVanAssignment, User } = require('../models');

async function createVehicle(data, factoryId) {
  return CashVanVehicle.create({ ...data, factory_id: factoryId });
}

async function listVehicles(factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  return CashVanVehicle.findAll({
    where,
    include: [
      { association: 'driver', attributes: ['id', 'name', 'email'] },
      { association: 'salesRep', attributes: ['id', 'name', 'email'] },
    ],
    order: [['code', 'ASC']],
  });
}

async function createAssignment(data, factoryId) {
  const vehicle = await CashVanVehicle.findOne({ where: { id: data.vehicle_id, factory_id: factoryId } });
  if (!vehicle) {
    const err = new Error('Cash van vehicle not found.');
    err.statusCode = 404;
    throw err;
  }
  const rep = await User.findOne({ where: { id: data.rep_id, factory_id: factoryId } });
  if (!rep) {
    const err = new Error('Sales rep user not found.');
    err.statusCode = 404;
    throw err;
  }
  let driver = null;
  if (data.driver_id) {
    driver = await User.findOne({ where: { id: data.driver_id, factory_id: factoryId } });
    if (!driver) {
      const err = new Error('Driver user not found.');
      err.statusCode = 404;
      throw err;
    }
  }
  const row = await CashVanAssignment.create({
    factory_id: factoryId,
    vehicle_id: data.vehicle_id,
    driver_id: data.driver_id || null,
    rep_id: data.rep_id,
    start_at: data.start_at || new Date(),
    status: 'active',
  });
  await vehicle.update({
    assigned_driver_id: driver?.id || null,
    assigned_rep_id: rep.id,
  });
  return row;
}

async function listAssignments(factoryId) {
  const where = {};
  if (factoryId) where.factory_id = factoryId;
  return CashVanAssignment.findAll({
    where,
    include: [
      { association: 'vehicle', attributes: ['id', 'code', 'plate_number'] },
      { association: 'driver', attributes: ['id', 'name'] },
      { association: 'rep', attributes: ['id', 'name'] },
    ],
    order: [['start_at', 'DESC']],
  });
}

module.exports = {
  createVehicle,
  listVehicles,
  createAssignment,
  listAssignments,
};
