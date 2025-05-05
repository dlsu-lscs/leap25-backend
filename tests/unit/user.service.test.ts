import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as UserService from '../../services/user.service';
import { getDB } from '../../config/database';

// Mock the database
vi.mock('../../config/database', () => ({
  getDB: vi.fn().mockResolvedValue({
    query: vi.fn(),
    execute: vi.fn(),
  }),
}));

describe('UserService', () => {
  let mockDb: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDb = await getDB();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Setup
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        display_picture: 'https://example.com/pic.jpg',
      };

      mockDb.execute.mockResolvedValueOnce([{ insertId: 1 }]);

      // Execute
      const result = await UserService.createUser(userData);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledWith(
        'INSERT INTO users (email, display_picture, name, google_id) VALUES (?, ?, ?, ?)',
        [userData.email, userData.display_picture, userData.name, null]
      );
      expect(result).toEqual({
        id: 1,
        ...userData,
        google_id: undefined, // null value in SQL == undefined in ts objects
      });
    });

    it('should handle database errors', async () => {
      // Setup
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const error = new Error('Database error');
      mockDb.execute.mockRejectedValueOnce(error);

      // Execute & Assert
      await expect(UserService.createUser(userData)).rejects.toThrow();
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      // Setup
      const mockUsers = [
        { id: 1, email: 'user1@example.com', name: 'User 1' },
        { id: 2, email: 'user2@example.com', name: 'User 2' },
      ];
      mockDb.query.mockResolvedValueOnce([mockUsers]);

      // Execute
      const result = await UserService.getAllUsers();

      // Assert
      expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM users');
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should return user for valid id', async () => {
      // Setup
      const userId = 1;
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
      };

      mockDb.query.mockResolvedValueOnce([[mockUser]]);

      // Execute
      const result = await UserService.getUserById(userId);

      // Assert
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid user id', async () => {
      // Setup
      const userId = 999;
      mockDb.query.mockResolvedValueOnce([[]]);

      // Execute
      const result = await UserService.getUserById(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      // Setup
      const userId = 1;
      const existingUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        display_picture: 'https://example.com/old.jpg',
      };

      const updateData = {
        name: 'Updated Name',
        display_picture: 'https://example.com/new.jpg',
      };

      // Mock the first getUserById call to get existing user
      mockDb.query.mockResolvedValueOnce([[existingUser]]);
      // Mock the execute call for update
      mockDb.execute.mockResolvedValueOnce([{}]);
      // Mock the second getUserById call to get updated user
      mockDb.query.mockResolvedValueOnce([
        [{ ...existingUser, ...updateData }],
      ]);

      // Execute
      const result = await UserService.updateUser(userId, updateData);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledWith(
        'UPDATE users SET email = ?, display_picture = ?, name = ?, google_id = ? WHERE id = ?',
        [
          existingUser.email,
          updateData.display_picture,
          updateData.name,
          null,
          userId,
        ]
      );
      expect(result).toEqual({ ...existingUser, ...updateData });
    });

    it('should return null when updating non-existent user', async () => {
      // Setup
      const userId = 999;
      mockDb.query.mockResolvedValueOnce([[]]); // No user found

      // Execute
      const result = await UserService.updateUser(userId, { name: 'New Name' });

      // Assert
      expect(result).toBeNull();
      expect(mockDb.execute).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      // Setup
      const userId = 1;
      mockDb.execute.mockResolvedValueOnce([{}]);

      // Execute
      await UserService.deleteUser(userId);

      // Assert
      expect(mockDb.execute).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );
    });
  });
});
