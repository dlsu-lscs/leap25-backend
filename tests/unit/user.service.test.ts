import { describe, it, expect, afterAll } from 'vitest';
import * as UserService from '../user.service';
import { db } from '../../config/db';
import type { CreateUser, UpdateUser } from '../../models/user';

describe('UserService', () => {
  let UID: number;

  const UserData: CreateUser = {
    email: 'testemail@example.com',
    name: 'Test User',
    display_picture: '',
  };

  // Cleanup
  afterAll(async () => {
    if (UID) {
      await UserService.deleteUser(UID);
    }
    await db.end();
  });

  it('should create a new user', async () => {
    const user = await UserService.createUser(UserData);

    expect(user).toHaveProperty('id');
    expect(user.email).toBe(UserData.email);
    expect(user.name).toBe(UserData.name);

    UID = user.id;
  });

  it('should get all users', async () => {
    const users = await UserService.getAllUsers();

    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  it('should get a user by id', async () => {
    const user = await UserService.getUserById(UID);

    expect(user).not.toBeNull();
    if (user) {
      expect(user.id).toBe(UID);
      expect(user.email).toBe(UserData.email);
    }
  });

  it('should update a user', async () => {
    const updatedData: UpdateUser = {
      name: 'Updated Test User',
    };

    const updatedUser = await UserService.updateUser(UID, updatedData);

    expect(updatedUser).not.toBeNull();
    if (updatedUser) {
      expect(updatedUser.name).toBe(updatedData.name);
    }
  });

  it('should delete a user', async () => {
    await UserService.deleteUser(UID);
    const deletedUser = await UserService.getUserById(UID);

    expect(deletedUser).toBeNull();
  });
});
