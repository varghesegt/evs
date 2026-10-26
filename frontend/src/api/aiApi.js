import client from './client';

export const estimateFoodQuantity = (data) => client.post('/ai/estimate-quantity', data);
export const getAiAccuracyStats = () => client.get('/ai/accuracy-stats');
export const getDemandForecast = () => client.get('/ai/demand-forecast');
export const solveCvrpRoute = (data) => client.post('/ai/cvrp-optimize', data);
export const solveVrptwRoute = (data) => client.post('/ai/vrptw-optimize', data);
export const matchRouteVolunteer = (data) => client.post('/ai/match-route-volunteer', data);
export const getVolunteerRouteForDonation = (donationId) => client.get(`/ai/match-volunteer-route/${donationId}`);
export const parseVoiceDonation = (transcript) => client.post('/ai/parse-voice-donation', { transcript });
export const getSurgeStatus = () => client.get('/ai/surge-status');
export const triggerSurgeBroadcast = (donationId) => client.post(`/ai/surge-broadcast/${donationId}`);


