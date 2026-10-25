import axios from 'axios';
import { ScanResult, ScanHistoryItem, DemoProjectInfo, BBM92SimulationResult } from '../types/scan';

const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Determine API root: support VITE_API_URL, fallback to live Render service in production or localhost in development
const getApiBase = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  let base = envUrl && envUrl.trim() !== '' 
    ? envUrl.trim() 
    : (isLocalhost ? 'http://localhost:8000/api' : 'https://quantumshield-asft.onrender.com/api');
  
  // Clean trailing slashes
  base = base.replace(/\/+$/, '');
  // Ensure it has /api prefix
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
};

export const API_BASE = getApiBase();

export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const res = await axios.get(`${API_BASE}/health`, { timeout: 8000 });
    return res.data?.status === 'healthy';
  } catch (err) {
    // Retry once in case of initial cold start latency
    try {
      const retryRes = await axios.get(`${API_BASE}/health`, { timeout: 8000 });
      return retryRes.data?.status === 'healthy';
    } catch {
      return false;
    }
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

export const runShorSimulation = async (targetNumber: number = 15, coprimeA: number = 7, shots: number = 1024) => {
  const formData = new FormData();
  formData.append('target_number', targetNumber.toString());
  formData.append('coprime_a', coprimeA.toString());
  formData.append('shots', shots.toString());

  const res = await axios.post(`${API_BASE}/quantum/shor`, formData);
  return res.data;
};

export const runGroverSimulation = async (targetState: string = '101', shots: number = 1024) => {
  const formData = new FormData();
  formData.append('target_state', targetState);
  formData.append('shots', shots.toString());

  const res = await axios.post(`${API_BASE}/quantum/grover`, formData);
  return res.data;
};

export const fetchQuantumAnalysis = async (scanId: string) => {
  const res = await axios.get(`${API_BASE}/quantum/analysis/${scanId}`);
  return res.data;
};

export const runBBM92Simulation = async (
  pairCount: number = 50,
  scenario: 'ideal' | 'eve' | 'noisy' = 'ideal',
  noiseRate: number = 0.08,
  eveInterceptProb: number = 1.0,
  testFraction: number = 0.35
): Promise<BBM92SimulationResult> => {
  const res = await axios.post(`${API_BASE}/quantum/bbm92/run`, {
    pair_count: pairCount,
    scenario,
    noise_rate: noiseRate,
    eve_intercept_prob: eveInterceptProb,
    test_fraction: testFraction,
  });
  return res.data;
};

