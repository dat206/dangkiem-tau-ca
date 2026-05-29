import { authAxios } from './authApi';

export const getUsers = async () => {
  const res = await authAxios.get('/auth/users');
  return res.data;
};

export const createUser = async (payload) => {
  const res = await authAxios.post('/auth/users', payload);
  return res.data;
};

export const updateUser = async (userId, payload) => {
  const res = await authAxios.patch(`/auth/users/${userId}`, payload);
  return res.data;
};

export const deleteUser = async (userId) => {
  await authAxios.delete(`/auth/users/${userId}`);
};

export const userApi = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
