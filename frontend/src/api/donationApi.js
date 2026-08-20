import client from './client';

export const createDonation = (data) => client.post('/donations/create', data);
export const getMyDonations = () => client.get('/donations/my');
export const getAvailableDonations = () => client.get('/donations/available');
export const getDonation = (id) => client.get(`/donations/${id}`);
export const getAllDonations = () => client.get('/donations/all');
