export interface StaticAnalysis {
  fileInfo: {
    name: string;
    size: number;
    type: string;
    lastModified: string;
  };
  hashes: {
    sha256: string;
  };
  entropy: number;
  strings: string[];
  suspiciousKeywords: { keyword: string; count: number }[];
  extractedUrls: string[];
  textContent?: string; 
  archiveContents?: string[];
}

export interface AIPrediction {
  prediction: 'Safe' | 'Suspicious' | 'Malicious' | 'Unknown';
  riskScore: number;
  summary: string;
  iocs: { type: string; value: string; reputation?: string }[];
  threats: string[];
  recommendations: string[];
  simulatedBehavior: string[];
  attackTactics: { id: string; name: string; description: string }[];
}

export type AnalysisResult = StaticAnalysis & AIPrediction;

export interface HistoryItem {
  id: string;
  fileName: string;
  prediction: AIPrediction['prediction'];
  riskScore: number;
  timestamp: string;
  result: AnalysisResult;
}
