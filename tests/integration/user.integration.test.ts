import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import * as UserService from '../../services/user.service';
import db from '../../config/connectdb';
// import { db } from '../setup-mockdb.ts';

describe('UserService Integration Tests', () => {
  let createdUserId: number;

  const testUser = {
    email: 'integration-test@example.com',
    name: 'Integration Test User',
    display_picture: 'https://example.com/pic.jpg',
  };

  // Clean up any leftover test data
  beforeAll(async () => {
    await db.execute('DELETE FROM users WHERE email = ?', [testUser.email]);
  });

  afterAll(async () => {
    // Additional cleanup
    await db.execute('DELETE FROM users WHERE email = ?', [testUser.email]);
    await db.end();
  });

  it('should create a new user', async () => {
    const user = await UserService.createUser(testUser);

    expect(user).toHaveProperty('id');
    expect(user.email).toBe(testUser.email);
    expect(user.name).toBe(testUser.name);
    expect(user.display_picture).toBe(testUser.display_picture);

    createdUserId = Number(user.id);
  });

  it('should get all users', async () => {
    const users = await UserService.getAllUsers();

    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);

    // Find our test user
    const foundUser = users.find((u) => u.id === createdUserId);
    expect(foundUser).toBeDefined();
    expect(foundUser?.email).toBe(testUser.email);
  });

  it('should get a user by id', async () => {
    const user = await UserService.getUserById(createdUserId);

    expect(user).not.toBeNull();
    expect(user?.id).toBe(createdUserId);
    expect(user?.email).toBe(testUser.email);
    expect(user?.name).toBe(testUser.name);
  });

  it('should return null when getting non-existent user', async () => {
    const user = await UserService.getUserById(99999);
    expect(user).toBeNull();
  });

  it('should update a user', async () => {
    const updatedData = {
      name: 'Updated Integration User',
      display_picture: 'https://example.com/updated.jpg',
    };

    const updatedUser = await UserService.updateUser(
      createdUserId,
      updatedData
    );

    expect(updatedUser).not.toBeNull();
    expect(updatedUser?.id).toBe(createdUserId);
    expect(updatedUser?.name).toBe(updatedData.name);
    expect(updatedUser?.display_picture).toBe(updatedData.display_picture);
    expect(updatedUser?.email).toBe(testUser.email); // Email should remain unchanged
  });

  it('should delete a user', async () => {
    await UserService.deleteUser(createdUserId);
    const deletedUser = await UserService.getUserById(createdUserId);

    expect(deletedUser).toBeNull();
  });
});
