require('dotenv').config();

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@system.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

const SYSTEM_ADMIN_ID = 'system-admin';

module.exports = { ADMIN_EMAIL, ADMIN_PASSWORD, SYSTEM_ADMIN_ID };
