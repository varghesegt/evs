import client from './client';

export const getNgoDonations = () => client.get('/ngo/donations');
export const acceptDonation = (id) => client.post(`/ngo/accept/${id}`);
export const assignVolunteer = (donationId, volunteerId) =>
  client.post(`/ngo/assign-volunteer/${donationId}?volunteerId=${volunteerId}`);
export const getVolunteers = () => client.get('/ngo/volunteers');
