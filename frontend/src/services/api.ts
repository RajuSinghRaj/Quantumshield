import axios from 'axios';
import {
  ScanResult, ScanHistoryItem, DemoProjectInfo, BBM92SimulationResult, CBOMDocument,
  TLSScanData, CertificateDetails, KeyAnalysisResult,
  RiskIntelligenceData, HNDLProfile, MigrationPriorityItem,
  CodeRemediationProposal, RemediationComparison, HybridDemoResult,
  DevSecOpsPolicy, SecurityAssessment, DevSecOpsAssessmentListItem
} from '../types/scan';

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

export const getCbomExportUrl = (scanId: string): string => {
  return `${API_BASE}/scan/${scanId}/cbom.json`;
};

export const fetchCbom = async (scanId: string): Promise<CBOMDocument> => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/cbom`);
  return res.data;
};

export const fetchScanDependencies = async (scanId: string) => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/dependencies`);
  return res.data;
};

export const fetchScanDependencyGraph = async (scanId: string) => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/dependency-graph`);
  return res.data;
};

export const fetchScanMigrationImpact = async (scanId: string) => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/migration-impact`);
  return res.data;
};

export const scanDependenciesDirect = async (files: File[], projectName: string = 'Manifest Audit') => {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  formData.append('project_name', projectName);

  const res = await axios.post(`${API_BASE}/dependencies/scan`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ==================== BATCH 3: TLS & CERTIFICATE / KEY API ====================

export const scanTlsDomain = async (domain: string): Promise<TLSScanData> => {
  const formData = new FormData();
  formData.append('domain', domain);
  const res = await axios.post(`${API_BASE}/tls/scan`, formData);
  return res.data;
};

export const analyzeCertificate = async (
  file?: File,
  content?: string
): Promise<{ total_certificates: number; certificates: CertificateDetails[] }> => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (content) {
    formData.append('content', content);
  }
  const res = await axios.post(`${API_BASE}/certificates/analyze`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const analyzeKey = async (
  file?: File,
  content?: string,
  password?: string
): Promise<KeyAnalysisResult> => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (content) {
    formData.append('content', content);
  }
  if (password) {
    formData.append('password', password);
  }
  const res = await axios.post(`${API_BASE}/keys/analyze`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const fetchScanTls = async (scanId: string): Promise<TLSScanData> => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/tls`);
  return res.data;
};

export const fetchScanCertificates = async (scanId: string): Promise<CertificateDetails[]> => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/certificates`);
  return res.data;
};

export const fetchScanCertificateById = async (
  scanId: string,
  certificateId: string
): Promise<CertificateDetails> => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/certificates/${certificateId}`);
  return res.data;
};

export const runShorSimulation = async (targetNumber: number = 15, coprimeA: number = 7, shots: number = 1024) => {
  const formData = new FormData();
  formData.append('target_number', targetNumber.toString());
  formData.append('coprime_a', coprimeA.toString());
  formData.append('shots', shots.toString());

  const res = await axios.post(`${API_BASE}/quantum/shor`, formData);
  return res.data;
};

export const runGroverSimulation = async (targetState: string = '101', shots: number = 1024, iterations?: number) => {
  const formData = new FormData();
  formData.append('target_state', targetState);
  formData.append('shots', shots.toString());
  if (iterations !== undefined) {
    formData.append('iterations', iterations.toString());
  }

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

// ==================== BATCH 4: QUANTUM RISK INTELLIGENCE & HNDL ====================

export const fetchRiskAnalysis = async (scanId: string): Promise<RiskIntelligenceData> => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/risk-analysis`);
  return res.data;
};

export const fetchRiskBreakdown = async (scanId: string): Promise<any> => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/risk-breakdown`);
  return res.data;
};

export const fetchMigrationPriorities = async (scanId: string): Promise<MigrationPriorityItem[]> => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/migration-priorities`);
  return res.data;
};

export const fetchHndlAnalysis = async (scanId: string): Promise<HNDLProfile> => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/hndl`);
  return res.data;
};

export const assessHndlCategory = async (
  scanId: string,
  payload: {
    category: string;
    sensitivity?: string;
    lifetime?: string;
    description?: string;
    associated_assets?: string[];
  }
): Promise<{ assessment: any; hndl_analysis: HNDLProfile; overall_security_risk: any }> => {
  const res = await axios.post(`${API_BASE}/scan/${scanId}/hndl/assess`, payload);
  return res.data;
};

export const fetchQuantumReadiness = async (scanId: string): Promise<any> => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/readiness`);
  return res.data;
};

// ==================== BATCH 5: PQC REMEDIATION, SANDBOX & HYBRID LAB ====================

export const fetchRemediationProposals = async (scanId: string): Promise<{
  scan_id: string;
  total_proposals: number;
  proposals: CodeRemediationProposal[];
  applied_patches?: any[];
  comparison?: RemediationComparison;
}> => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/remediation`);
  return res.data;
};

export const generateSpecificRemediation = async (
  scanId: string,
  payload: { file_path: string; line_number?: number | null; finding?: any }
): Promise<CodeRemediationProposal> => {
  const res = await axios.post(`${API_BASE}/scan/${scanId}/remediation/generate`, payload);
  return res.data;
};

export const applyRemediationPatch = async (
  scanId: string,
  payload: { file_path: string; line_number?: number | null; finding?: any }
): Promise<{ success: boolean; message: string; patch: any; file_content: string; sandbox_id: string; applied_count: number }> => {
  const res = await axios.post(`${API_BASE}/scan/${scanId}/remediation/apply`, payload);
  return res.data;
};

export const rejectRemediationPatch = async (
  scanId: string,
  payload: { file_path: string; finding_id?: string | number }
): Promise<{ success: boolean; message: string; audit_entry: any }> => {
  const res = await axios.post(`${API_BASE}/scan/${scanId}/remediation/reject`, payload);
  return res.data;
};

export const rescanSandboxProject = async (scanId: string): Promise<{
  success: boolean;
  comparison: RemediationComparison;
  remediated_scan: ScanResult;
}> => {
  const res = await axios.post(`${API_BASE}/scan/${scanId}/remediation/rescan`);
  return res.data;
};

export const fetchRemediationComparison = async (scanId: string): Promise<RemediationComparison> => {
  const res = await axios.get(`${API_BASE}/scan/${scanId}/remediation/comparison`);
  return res.data;
};

export const runHybridDemo = async (payload?: { message?: string; associated_data?: string; simulate_tamper?: boolean }): Promise<HybridDemoResult> => {
  const res = await axios.post(`${API_BASE}/hybrid/demo/run`, payload || {});
  return res.data;
};

export const fetchHybridComparison = async (): Promise<Record<string, any>> => {
  const res = await axios.get(`${API_BASE}/hybrid/comparison`);
  return res.data;
};

// ==================== BATCH 7: DEVSECOPS & CI/CD SECURITY GATE API ====================

export const fetchDevSecOpsPolicies = async (includeDisabled = true): Promise<DevSecOpsPolicy[]> => {
  const res = await axios.get(`${API_BASE}/devsecops/policies?include_disabled=${includeDisabled}`);
  return res.data;
};

export const updateDevSecOpsPolicy = async (
  policyId: string,
  updates: { enabled?: boolean; enforcement?: string; severity?: string; description?: string }
): Promise<DevSecOpsPolicy> => {
  const res = await axios.put(`${API_BASE}/devsecops/policies/${policyId}`, updates);
  return res.data;
};

export const createDevSecOpsPolicy = async (policy: Partial<DevSecOpsPolicy>): Promise<DevSecOpsPolicy> => {
  const res = await axios.post(`${API_BASE}/devsecops/policies`, policy);
  return res.data;
};

export const deleteDevSecOpsPolicy = async (policyId: string): Promise<{ success: boolean; message: string }> => {
  const res = await axios.delete(`${API_BASE}/devsecops/policies/${policyId}`);
  return res.data;
};

export const evaluateDevSecOps = async (payload: {
  scan_id?: string;
  project_name?: string;
  policy_content?: string;
  files?: File[];
  policy_file?: File;
}): Promise<SecurityAssessment> => {
  if (payload.files && payload.files.length > 0) {
    const formData = new FormData();
    payload.files.forEach(f => formData.append('files', f));
    if (payload.policy_file) {
      formData.append('policy_file', payload.policy_file);
    }
    if (payload.project_name) {
      formData.append('project_name', payload.project_name);
    }
    const res = await axios.post(`${API_BASE}/devsecops/evaluate`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  } else {
    const res = await axios.post(`${API_BASE}/devsecops/evaluate`, {
      scan_id: payload.scan_id,
      project_name: payload.project_name,
      policy_content: payload.policy_content
    });
    return res.data;
  }
};

export const fetchDevSecOpsAssessments = async (): Promise<DevSecOpsAssessmentListItem[]> => {
  const res = await axios.get(`${API_BASE}/devsecops/assessments`);
  return res.data;
};

export const fetchDevSecOpsAssessmentById = async (assessmentId: string): Promise<SecurityAssessment> => {
  const res = await axios.get(`${API_BASE}/devsecops/assessments/${assessmentId}`);
  return res.data;
};

export const getDevSecOpsReportUrl = (assessmentId: string): string => {
  return `${API_BASE}/devsecops/assessments/${assessmentId}/report`;
};

export const getDevSecOpsCbomUrl = (assessmentId: string): string => {
  return `${API_BASE}/devsecops/assessments/${assessmentId}/cbom`;
};



