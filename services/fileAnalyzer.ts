import type { StaticAnalysis } from '../types';

declare const JSZip: any;

const SUSPICIOUS_KEYWORDS = [
  'eval', 'exec', 'Shell', 'PowerShell', 'cmd.exe', 'Invoke-', 'rundll32',
  'DownloadString', 'FromBase64String', 'GetProcAddress', 'LoadLibrary', 'CreateProcess',
  'CreateRemoteThread', 'VirtualAlloc', 'WriteProcessMemory', 'RegWrite', 'RegOpenKey',
  'SetWindowsHook', 'keylogger', 'trojan', 'malware', 'exploit', 'CVE-', 'rootkit',
  'http://', 'https://', 'socket', 'bind', 'listen', 'connect', '.onion', 'C2 server'
];

const SCRIPT_EXTENSIONS = ['.js', '.py', '.ps1', '.bat', '.sh', '.vbs'];

// Basic regex for URLs and IPs
const URL_REGEX = /(https?:\/\/[^\s"'<>`]+)/g;
const IP_REGEX = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;


async function calculateSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function calculateEntropy(buffer: Uint8Array): number {
  if (buffer.length === 0) return 0;
  const byteCounts = new Array(256).fill(0);
  for (let i = 0; i < buffer.length; i++) {
    byteCounts[buffer[i]]++;
  }

  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (byteCounts[i] === 0) continue;
    const probability = byteCounts[i] / buffer.length;
    entropy -= probability * (Math.log(probability) / Math.log(2));
  }
  return entropy;
}

function extractStrings(buffer: Uint8Array): string[] {
  const result: string[] = [];
  let currentString = '';
  for (let i = 0; i < buffer.length; i++) {
    const charCode = buffer[i];
    // Printable ASCII characters
    if (charCode >= 32 && charCode <= 126) {
      currentString += String.fromCharCode(charCode);
    } else {
      if (currentString.length >= 4) { // Only keep strings of 4+ characters
        result.push(currentString);
      }
      currentString = '';
    }
  }
  if (currentString.length >= 4) {
    result.push(currentString);
  }
  return result;
}

function findSuspiciousKeywords(strings: string[]): { keyword: string; count: number }[] {
  const keywordCounts: { [key: string]: number } = {};
  
  const lowerCaseStrings = strings.join(' ').toLowerCase();

  SUSPICIOUS_KEYWORDS.forEach(keyword => {
    const lowerCaseKeyword = keyword.toLowerCase();
    const regex = new RegExp(lowerCaseKeyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
    const matches = lowerCaseStrings.match(regex);
    if (matches) {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + matches.length;
    }
  });

  return Object.entries(keywordCounts)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count);
}

function extractUrls(strings: string[]): string[] {
    const allStrings = strings.join('\n');
    const urls = allStrings.match(URL_REGEX) || [];
    const ips = allStrings.match(IP_REGEX) || [];
    // Remove duplicates
    return [...new Set([...urls, ...ips])];
}


export const analyzeFile = async (file: File, onProgress: (status: string) => void): Promise<StaticAnalysis> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (!event.target?.result || !(event.target.result instanceof ArrayBuffer)) {
          throw new Error('Failed to read file buffer.');
        }
        
        const buffer = event.target.result;
        const uint8Array = new Uint8Array(buffer);
        
        onProgress('Calculating hashes...');
        const sha256 = await calculateSHA256(buffer);

        onProgress('Calculating entropy...');
        const entropy = calculateEntropy(uint8Array);
        
        onProgress('Extracting strings & IOCs...');
        const strings = extractStrings(uint8Array);
        const suspiciousKeywords = findSuspiciousKeywords(strings);
        const extractedUrls = extractUrls(strings);
        
        const result: StaticAnalysis = {
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified).toLocaleString(),
          },
  
          hashes: {
            sha256,
          },
          entropy,
          strings,
          suspiciousKeywords,
          extractedUrls,
        };

        // Check for script files
        if (SCRIPT_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
            onProgress('Reading script content...');
            result.textContent = new TextDecoder().decode(uint8Array);
        }

        // Check for ZIP files
        if (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')) {
            onProgress('Analyzing archive contents...');
            try {
                const zip = await JSZip.loadAsync(buffer);
                result.archiveContents = Object.keys(zip.files);
            } catch (zipError) {
                console.error("Could not process ZIP file:", zipError);
                result.archiveContents = ['Error reading archive contents.'];
            }
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(new Error('File reading failed: ' + error));
    };

    reader.readAsArrayBuffer(file);
  });
};
