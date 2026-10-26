import client from './client';

export const logHaccpTelemetry = (data) => client.post('/haccp/log-telemetry', data);
export const getHaccpTelemetry = (donationId) => client.get(`/haccp/telemetry/${donationId}`);
