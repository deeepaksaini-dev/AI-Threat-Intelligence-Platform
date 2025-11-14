import { GoogleGenAI, Type } from "@google/genai";
import type { StaticAnalysis, AIPrediction } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const generatePrompt = (analysis: StaticAnalysis): string => {
  let prompt = `
    You are a world-class cybersecurity threat intelligence analyst. Your task is to analyze the following static file analysis report and provide a comprehensive threat assessment in a structured JSON format.

    **File Static Analysis Report:**
    - **File Name:** "${analysis.fileInfo.name}"
    - **File Size:** ${analysis.fileInfo.size} bytes
    - **File Type:** "${analysis.fileInfo.type || 'unknown'}"
    - **SHA-256 Hash:** ${analysis.hashes.sha256}
    - **Entropy:** ${analysis.entropy.toFixed(4)}
    
    **Key Observations:**
  `;

  if (analysis.entropy > 7.5) {
    prompt += `- **High Entropy Detected:** This high entropy is a strong indicator of packed, compressed, or encrypted data, a common malware evasion technique. This significantly increases the suspicion level.\n`;
  }

  if (analysis.suspiciousKeywords.length > 0) {
    prompt += `- **Suspicious Keywords Found:** The file contains strings like [${analysis.suspiciousKeywords.slice(0, 5).map(k => k.keyword).join(', ')}], which are associated with malicious capabilities such as process injection, network communication, or system manipulation.\n`;
  }
  
  if (analysis.extractedUrls.length > 0) {
      prompt += `- **Network Indicators Found:** The file contains the following URLs/IPs: [${analysis.extractedUrls.join(', ')}]. These should be treated as potential Indicators of Compromise (IOCs).\n`;
  }

  if (analysis.archiveContents) {
    prompt += `- **Archive Analysis:** This is an archive containing: [${analysis.archiveContents.join(', ')}]. The contents should be evaluated as a whole for malicious intent.\n`;
  }

  if (analysis.textContent) {
    prompt += `- **Script Content Analysis:** The following script content was extracted. Analyze it for obfuscation, malicious commands, or vulnerabilities:\n---\n${analysis.textContent.substring(0, 1500)}\n---\n`;
  }

  prompt += `
    **Your Task:**
    Based on all the information provided, perform a deep analysis and return a single JSON object.

    **JSON Output Structure:**
    1.  **prediction**: Classify the file as 'Safe', 'Suspicious', or 'Malicious'.
    2.  **riskScore**: Assign a numerical risk score from 0 (Safe) to 100 (Critical).
    3.  **summary**: A concise, one-sentence executive summary of the findings.
    4.  **iocs**: An array of "Indicators of Compromise". Include the file hash and any extracted URLs/IPs. For URLs/IPs, add a 'reputation' field noting if they are potentially malicious or unknown.
    5.  **threats**: An array of strings describing the specific potential threats or malicious capabilities identified (e.g., "May attempt to establish a network connection for C2 communication.").
    6.  **recommendations**: An array of actionable steps for the user (e.g., "Do not execute this file.", "Block associated URLs in the firewall.").
    7.  **simulatedBehavior**: An array of strings describing the likely actions the file would take if executed. Be specific (e.g., "Attempts to write a new file to 'C:\\Temp\\xyz.dll'", "Tries to connect to IP address 123.45.67.89 on port 443."). This is a simulation based on the static data.
    8.  **attackTactics**: An array of objects, mapping the behavior to the MITRE ATT&CK® framework. Each object should have 'id', 'name', and a brief 'description' of how the file might use that tactic. Example: { "id": "T1059", "name": "Command and Scripting Interpreter", "description": "The file may use PowerShell or cmd.exe to execute commands." }.
  `;

  return prompt;
};


export const getAIPrediction = async (analysis: StaticAnalysis): Promise<AIPrediction> => {
  const model = 'gemini-2.5-flash';
  const prompt = generatePrompt(analysis);

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prediction: { type: Type.STRING },
            riskScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            iocs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  value: { type: Type.STRING },
                  reputation: { type: Type.STRING }
                }
              }
            },
            threats: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            simulatedBehavior: { type: Type.ARRAY, items: { type: Type.STRING } },
            attackTactics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          },
          required: ["prediction", "riskScore", "summary", "iocs", "threats", "recommendations", "simulatedBehavior", "attackTactics"],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as AIPrediction;

    // Basic validation and normalization
    // FIX: Add explicit type to `validPredictions` to ensure type safety when assigning to `result.prediction`.
    const validPredictions: ('Safe' | 'Suspicious' | 'Malicious')[] = ['Safe', 'Suspicious', 'Malicious'];
    const foundPrediction = validPredictions.find(p => p.toLowerCase() === result.prediction.toLowerCase());
    result.prediction = foundPrediction || 'Unknown';
    
    // Ensure IOCs contain the file hash
    if (!result.iocs.some(ioc => ioc.type.toLowerCase() === 'sha256')) {
        result.iocs.unshift({ type: 'SHA256', value: analysis.hashes.sha256, reputation: 'N/A' });
    }

    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("The AI model failed to generate a valid threat intelligence report. This could be due to API restrictions or an unexpected error.");
  }
};