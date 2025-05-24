import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as BookmarkService from '../../services/bookmark.service';
import { getDB } from '../../config/database';

vi.mock('../../config/database', () => ({
  getDB: vi.fn().mockResolvedValue({
    execute: vi.fn(),
    query: vi.fn(),
  }),
}));

describe('BookmarkService Unit Tests', () => {
  let mockDb: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDb = await getDB();
  });

  it('should create a new bookmark', async () => {
    const user_id = 1;
    const event_id = 2;

    mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const result = await BookmarkService.createBookmark(user_id, event_id);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'INSERT INTO bookmarks (event_id, user_id) VALUES (?, ?)',
      [event_id, user_id]
    );

    expect(result).toEqual({ event_id, user_id });
  });

  it('should return null if bookmark creation fails', async () => {
    mockDb.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const result = await BookmarkService.createBookmark(1, 2);

    expect(result).toBeNull();
  });

  it('should return all bookmarks for a user', async () => {
    const user_id = 1;
    const mockBookmarks = [
      { user_id: 1, event_id: 2 },
      { user_id: 1, event_id: 3 },
    ];

    mockDb.query.mockResolvedValueOnce([mockBookmarks]);

    const result = await BookmarkService.getAllUserBookmarks(user_id);

    expect(mockDb.query).toHaveBeenCalledWith(
      'SELECT * FROM bookmarks WHERE user_id = ?',
      [user_id]
    );

    expect(result).toEqual(mockBookmarks);
  });

  it('should return null if no bookmarks found for user', async () => {
    mockDb.query.mockResolvedValueOnce([[]]);

    const result = await BookmarkService.getAllUserBookmarks(1);

    expect(result).toBeNull();
  });

  it('should delete a bookmark', async () => {
    const user_id = 1;
    const event_id = 2;

    mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const result = await BookmarkService.deleteBookmark(user_id, event_id);

    expect(mockDb.execute).toHaveBeenCalledWith(
      'DELETE FROM bookmarks WHERE user_id = ? AND event_id = ?',
      [user_id, event_id]
    );

    expect(result).toBe(true);
  });

  it('should return false if delete fails', async () => {
    mockDb.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const result = await BookmarkService.deleteBookmark(1, 2);

    expect(result).toBe(false);
  });
});
