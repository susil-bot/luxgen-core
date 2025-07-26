/**
 * User Model Tests
 * Tests for User model functionality
 */

const User = require('../models/User');
const Tenant = require('../models/Tenant');

describe('User Model', () => {
  let testTenant;

  beforeEach(async () => {
    // Create test tenant
    testTenant = await Tenant.create({
      name: 'Test Tenant',
      slug: 'test-tenant',
      contactEmail: 'test@tenant.com',
      status: 'active'
    });
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        tenantId: testTenant._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'user'
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.tenantId.toString()).toBe(testTenant._id.toString());
      expect(user.isActive).toBe(true);
      expect(user.isVerified).toBe(false);
    });

    it('should hash password on save', async () => {
      const userData = {
        tenantId: testTenant._id,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'password123',
        role: 'user'
      };

      const user = await User.create(userData);

      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/);
    });

    it('should validate required fields', async () => {
      const userData = {
        // Missing required fields
        tenantId: testTenant._id
      };

      try {
        await User.create(userData);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.firstName).toBeDefined();
        expect(error.errors.lastName).toBeDefined();
        expect(error.errors.email).toBeDefined();
        expect(error.errors.password).toBeDefined();
      }
    });

    it('should validate email format', async () => {
      const userData = {
        tenantId: testTenant._id,
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email',
        password: 'password123'
      };

      try {
        await User.create(userData);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.email).toBeDefined();
      }
    });

    it('should validate password length', async () => {
      const userData = {
        tenantId: testTenant._id,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: '123' // Too short
      };

      try {
        await User.create(userData);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.password).toBeDefined();
      }
    });
  });

  describe('User Virtuals', () => {
    it('should generate fullName virtual', async () => {
      const user = await User.create({
        tenantId: testTenant._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      });

      expect(user.fullName).toBe('John Doe');
    });

    it('should generate displayName virtual', async () => {
      const user = await User.create({
        tenantId: testTenant._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      });

      expect(user.displayName).toBe('John Doe');
    });

    it('should check profile completion', async () => {
      const completeUser = await User.create({
        tenantId: testTenant._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+1234567890'
      });

      const incompleteUser = await User.create({
        tenantId: testTenant._id,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'password123'
        // Missing phone
      });

      expect(completeUser.isProfileComplete).toBe(true);
      expect(incompleteUser.isProfileComplete).toBe(false);
    });
  });

  describe('User Methods', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        tenantId: testTenant._id,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should compare passwords correctly', async () => {
      const isCorrect = await user.comparePassword('password123');
      const isIncorrect = await user.comparePassword('wrongpassword');

      expect(isCorrect).toBe(true);
      expect(isIncorrect).toBe(false);
    });

    it('should generate email verification token', () => {
      const token = user.generateEmailVerificationToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(user.emailVerificationToken).toBe(token);
      expect(user.emailVerificationExpires).toBeInstanceOf(Date);
    });

    it('should verify email', () => {
      user.generateEmailVerificationToken();
      user.verifyEmail();

      expect(user.isVerified).toBe(true);
      expect(user.emailVerificationToken).toBeUndefined();
      expect(user.emailVerificationExpires).toBeUndefined();
    });

    it('should generate password reset token', () => {
      const token = user.generatePasswordResetToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(user.passwordResetToken).toBe(token);
      expect(user.passwordResetExpires).toBeInstanceOf(Date);
    });

    it('should reset password', () => {
      user.generatePasswordResetToken();
      user.resetPassword('newpassword123');

      expect(user.password).toBe('newpassword123');
      expect(user.passwordResetToken).toBeUndefined();
      expect(user.passwordResetExpires).toBeUndefined();
    });
  });

  describe('User Statics', () => {
    beforeEach(async () => {
      await User.create([
        {
          tenantId: testTenant._id,
          firstName: 'User1',
          lastName: 'Test',
          email: 'user1@example.com',
          password: 'password123',
          role: 'user',
          isActive: true
        },
        {
          tenantId: testTenant._id,
          firstName: 'User2',
          lastName: 'Test',
          email: 'user2@example.com',
          password: 'password123',
          role: 'admin',
          isActive: false
        },
        {
          tenantId: testTenant._id,
          firstName: 'User3',
          lastName: 'Test',
          email: 'user3@example.com',
          password: 'password123',
          role: 'user',
          isActive: true,
          isVerified: true
        }
      ]);
    });

    it('should find user by email', async () => {
      const user = await User.findByEmail('user1@example.com');

      expect(user).toBeDefined();
      expect(user.email).toBe('user1@example.com');
    });

    it('should find users by tenant', async () => {
      const users = await User.findByTenant(testTenant._id);

      expect(users).toHaveLength(3);
      users.forEach(user => {
        expect(user.tenantId.toString()).toBe(testTenant._id.toString());
        expect(user.isActive).toBe(true);
      });
    });

    it('should find active users', async () => {
      const users = await User.findActive();

      expect(users).toHaveLength(2);
      users.forEach(user => {
        expect(user.isActive).toBe(true);
      });
    });

    it('should find verified users', async () => {
      const users = await User.findVerified();

      expect(users).toHaveLength(1);
      users.forEach(user => {
        expect(user.isVerified).toBe(true);
      });
    });
  });

  describe('User Indexes', () => {
    it('should enforce unique email constraint', async () => {
      const userData = {
        tenantId: testTenant._id,
        firstName: 'Test',
        lastName: 'User',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      await User.create(userData);

      try {
        await User.create(userData);
        fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).toBe(11000);
        expect(error.keyPattern.email).toBeDefined();
      }
    });
  });
}); 