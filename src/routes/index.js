const router = require('express').Router();

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const userRoutes = require('./users');
const inventoryRoutes = require('./inventory');
const productRoutes = require('./products');
const productionRoutes = require('./production');
const salesRoutes = require('./sales');
const reportRoutes = require('./reports');

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Factory Management API is running.', timestamp: new Date() });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/products', productRoutes);
router.use('/production', productionRoutes);
router.use('/sales', salesRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
