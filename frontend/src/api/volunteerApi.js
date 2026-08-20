import client from './client';

export const getMyPickups = () => client.get('/volunteer/pickups');
export const getActivePickups = () => client.get('/volunteer/active');
export const markPickedUp = (id) => client.post(`/volunteer/pickup/${id}`);
export const markDelivered = (id, proofUrl) =>
  client.post(`/volunteer/deliver/${id}?proofUrl=${proofUrl || ''}`);
