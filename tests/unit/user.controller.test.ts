import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userController from '../../controllers/user.controller';
import * as userService from '../../services/user.service';

vi.mock('../../services/user.service');

const mockResponse = (): any => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);

  return res;
};

const mockNext = vi.fn();

describe('User Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get all users', async () => {
    const req = { query: {} } as any;
    const res = mockResponse();

    const fakeUser = [
      { id: 1, name: 'Test User', email: 'testemail@example.com' },
    ];
    (userService.getAllUsers as any).mockResolvedValue(fakeUser);

    await userController.getAllUsers(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeUser);
  });

  it('should create a user', async () => {
    const req = {
      body: { email: 'testemail@example.com', name: 'Test User' },
    } as any;
    const res = mockResponse();

    const createdUser = { id: 1, ...req.body };
    (userService.createUser as any).mockResolvedValue(createdUser);

    await userController.createUser(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdUser);
  });

  it('should get a user by id', async () => {
    const req = { params: { id: '1' } } as any;
    const res = mockResponse();

    const user = { id: 1, name: 'Test User', email: 'testemail@example.com' };
    (userService.getUserById as any).mockResolvedValue(user);

    await userController.getUserById(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it('should return 404 if user not found', async () => {
    const req = { params: { id: '999' } } as any;
    const res = mockResponse();

    (userService.getUserById as any).mockResolvedValue(null);

    await userController.getUserById(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('should update a user', async () => {
    const req = { params: { id: '1' }, body: { name: 'Updated Name' } } as any;
    const res = mockResponse();

    const updatedUser = {
      id: 1,
      name: 'Updated Name',
      email: 'testemail@example.com',
    };
    (userService.updateUser as any).mockResolvedValue(updatedUser);

    await userController.updateUser(req, res, mockNext);

    expect(res.status).toHaveBeenLastCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedUser);
  });

  it('should delete user', async () => {
    const req = { params: { id: '1' } } as any;
    const res = mockResponse();

    (userService.deleteUser as any).mockResolvedValue(undefined);

    await userController.deleteUser(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
