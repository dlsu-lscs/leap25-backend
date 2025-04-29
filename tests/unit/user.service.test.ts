import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as UserService from '../../services/user.service';
import { db } from '../../config/db';

// mock db
vi.mock('../../config/db', () => ({
  db: {
    execute: vi.fn(),
    query: vi.fn(),
  },
}));

describe('UserService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new user', async () => {
    const mockUser = {
      email: 'test@example.com',
      name: 'Test User',
      display_picture: '',
    };

    const mockResult = [{ insertId: 1 }];
    (db.execute as any).mockResolvedValueOnce(mockResult);

    const result = await UserService.createUser(mockUser);

    expect(db.execute).toHaveBeenCalledWith(
      'INSERT INTO users (email, display_picture, name, google_id) VALUES (?, ?, ?, ?)',
      [mockUser.email, mockUser.display_picture, mockUser.name, null]
    );
    expect(result).toEqual({
      id: 1,
      ...mockUser,
      google_id: undefined,
    });
  });

  it('should get all users', async () => {
    const mockUsers = [
      { id: 1, email: 'user1@example.com', name: 'User 1' },
      { id: 2, email: 'user2@example.com', name: 'User 2' },
    ];
    (db.query as any).mockResolvedValueOnce([mockUsers]);

    const result = await UserService.getAllUsers();

    expect(db.query).toHaveBeenCalledWith('SELECT * FROM users');
    expect(result).toEqual(mockUsers);
  });

  it('should get user by id', async () => {
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
    (db.query as any).mockResolvedValueOnce([[mockUser]]);

    const result = await UserService.getUserById(1);

    expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [
      1,
    ]);
    expect(result).toEqual(mockUser);
  });

  it('should return null if user not found', async () => {
    (db.query as any).mockResolvedValueOnce([[]]);

    const result = await UserService.getUserById(999);

    expect(result).toBeNull();
  });

  it('should update a user', async () => {
    const userId = 1;
    const updateData = { name: 'Updated Name' };
    const existingUser = {
      id: userId,
      email: 'test@example.com',
      name: 'Old Name',
      display_picture: null,
      google_id: null,
    };
    const updatedUser = { ...existingUser, ...updateData };

    // Mock getUserById call in updateUser
    (db.query as any).mockResolvedValueOnce([[existingUser]]);
    // Mock the update execute call
    (db.execute as any).mockResolvedValueOnce([{}]);
    // Mock the second getUserById call to return updated user
    (db.query as any).mockResolvedValueOnce([[updatedUser]]);

    const result = await UserService.updateUser(userId, updateData);

    expect(db.execute).toHaveBeenCalledWith(
      'UPDATE users SET email = ?, display_picture = ?, name = ?, google_id = ? WHERE id = ?',
      [existingUser.email, null, updateData.name, null, userId]
    );
    expect(result).toEqual(updatedUser);
  });

  it('should delete a user', async () => {
    const userId = 1;
    (db.execute as any).mockResolvedValueOnce([{}]);

    await UserService.deleteUser(userId);

    expect(db.execute).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', [
      userId,
    ]);
  });
});
