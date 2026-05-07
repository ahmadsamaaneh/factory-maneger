const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    const hashedPassword = await bcrypt.hash('Admin@123456', 12);
    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: 'System Admin',
        email: 'admin@factory.com',
        password: hashedPassword,
        role: 'admin',
        is_active: true,
        created_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@factory.com' });
  },
};
