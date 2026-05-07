require('dotenv').config();
const { Op } = require('sequelize');
const app = require('./app');
const { sequelize, Factory } = require('./models');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    await sequelize.sync({ alter: { drop: false } });
    console.log('✅ Database synced.');

    // One-time heal: restore factories wrongly auto-expired by the prior timezone bug.
    // (Status='expired' but end_date is still in the future → set back to 'active')
    const today = new Date().toISOString().slice(0, 10);
    const [healed] = await Factory.update(
      { subscription_status: 'active' },
      {
        where: {
          subscription_status: 'expired',
          subscription_end_date: { [Op.gte]: today },
        },
      }
    );
    if (healed > 0) console.log(`🩹 Healed ${healed} wrongly-expired factor${healed === 1 ? 'y' : 'ies'}.`);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
