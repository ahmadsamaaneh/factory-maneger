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

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error?.message || error);
    if (
      String(error?.message || '').includes('ECONNREFUSED') ||
      String(error?.message || '').includes('password authentication') ||
      String(error?.message || '').includes('database')
    ) {
      console.error('\n→ غالباً PostgreSQL غير شغّال أو إعدادات DB في ملف .env خاطئة (DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD).');
      console.error('→ شغّل خدمة PostgreSQL ثم أعد تشغيل: npm run dev\n');
    }
    process.exit(1);
  }
}

startServer();
