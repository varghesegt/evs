import client from './client';

export const estimateFoodQuantity = (data) => client.post('/ai/estimate-quantity', data);
export const getAiAccuracyStats = () => client.get('/ai/accuracy-stats');
