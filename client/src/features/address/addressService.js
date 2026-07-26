import api from '../../services/api';

const getAddresses = async () => {
  const response = await api.get('/addresses');
  return response.data.data.addresses;
};

const createAddress = async (addressData) => {
  const response = await api.post('/addresses', addressData);
  return response.data.data.address;
};

const updateAddress = async ({ id, addressData }) => {
  const response = await api.put(`/addresses/${id}`, addressData);
  return response.data.data.address;
};

const deleteAddress = async (id) => {
  await api.delete(`/addresses/${id}`);
  return id;
};

const setDefaultAddress = async (id) => {
  const response = await api.patch(`/addresses/${id}/default`);
  return response.data.data.address;
};

const addressService = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};

export default addressService;
