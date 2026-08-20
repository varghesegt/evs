import client from './client';

export const estimateFoodQuantity = (data) => client.post('/ai/estimate-quantity', data);
export const getAiAccuracyStats = () => client.get('/ai/accuracy-stats');
export const getDemandForecast = () => client.get('/ai/demand-forecast');
export const solveCvrpRoute = (data) => client.post('/ai/cvrp-optimize', data);
