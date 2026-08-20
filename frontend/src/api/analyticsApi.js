import client from './client';

export const getEnvironmentalSummary = () => client.get('/analytics/environmental');
export const getDashboardStats = () => client.get('/analytics/dashboard');
export const getPublicSummary = () => client.get('/analytics/public/summary');
export const getMapPins = () => client.get('/analytics/map-pins');
export const getDonorCertificate = (donorId) => client.get(`/analytics/certificate/donor/${donorId}`);

// Admin
export const getAllUsers = () => client.get('/admin/users');
export const getUsersByRole = (role) => client.get(`/admin/users/role/${role}`);
export const toggleUserStatus = (id) => client.patch(`/admin/users/${id}/toggle`);
export const approveNgo = (id) => client.patch(`/admin/ngo/${id}/approve`);
export const getAdminDonations = () => client.get('/admin/donations');
