const jwt = require('jsonwebtoken');

// Use the same JWT secret as the application
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production_min_32_chars';

// Generate a test JWT token
const payload = {
  userId: 'test-user-id',
  email: 'test@example.com',
  role: 'admin',
  tenantId: 'test-tenant'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

console.log('Test JWT Token:');
console.log(token);
console.log('\nUse this token in your Authorization header:');
console.log(`Authorization: Bearer ${token}`);
console.log('\nJWT Secret used:', JWT_SECRET); 