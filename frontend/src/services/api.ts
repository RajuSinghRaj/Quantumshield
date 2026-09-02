import axios from 'axios';
import { ScanResult, ScanHistoryItem, DemoProjectInfo } from '../types/scan';

const API_BASE = 'http://localhost:8000/api';

export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const res = await axios.get(`${API_BASE}/health`, { timeout: 3000 });
    return res.data.status === 'healthy';
  } catch (err) {
    return false;
  }
};

export const fetchDemoProjects = async (): Promise<DemoProjectInfo[]> => {
  const res = await axios.get(`${API_BASE}/demo-projects`);
  return res.data;
};

export const scanUploadedFiles = async (files: File[], projectName: string): Promise<ScanResult> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('project_name', projectName || 'Uploaded Cryptography Audit');

  const res = await axios.post(`${API_BASE}/scan/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const scanDomainTLS = async (domain: string): Promise<ScanResult> => {
  const formData = new FormData();
  formData.append('domain', domain);

  const res = await axios.post(`${API_BASE}/scan/domain`, formData);
  return res.data;
};

export const scanDemoProject = async (projectId: string): Promise<ScanResult> => {
  const formData = new FormData();
  formData.append('project_id', projectId);

  const res = await axios.post(`${API_BASE}/scan/demo`, formData);
  return res.data;
};

export const fetchScanResult = async (scanId: string): Promise<ScanResult> => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}`);
  return res.data;
};

export const fetchScanHistory = async (): Promise<ScanHistoryItem[]> => {
  const res = await axios.get(`${API_BASE}/history`);
  return res.data;
};

export const deleteScanRecord = async (scanId: string): Promise<void> => {
  await axios.delete(`${API_BASE}/history/${scanId}`);
};

export const getPdfReportUrl = (scanId: string): string => {
  return `${API_BASE}/scan/${scanId}/report.pdf`;
};
