import React, { useRef } from 'react';
import type { AnalysisResult } from '../types';
import { ResultCard } from './ResultCard';
import { FileIcon, HashIcon, BrainIcon, BarChartIcon, AlertTriangleIcon, DownloadIcon, ArchiveIcon, TargetIcon, NetworkIcon, ShieldCheckIcon, ActivityIcon } from './Icons';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

declare const jspdf: any;

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, onReset }) => {
  const { fileInfo, hashes, entropy, prediction, riskScore, summary, iocs, threats, recommendations, simulatedBehavior, attackTactics, archiveContents } = result;
  
  const getRiskColor = (score: number) => {
    if (score > 75) return 'text-red-400';
    if (score > 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskBgColor = (score: number) => {
    if (score > 75) return 'bg-red-500';
    if (score > 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getPredictionPillClasses = (pred: string) => {
    switch (pred.toLowerCase()) {
      case 'malicious':
        return 'bg-red-500/20 text-red-300 border-red-500';
      case 'suspicious':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500';
      case 'safe':
        return 'bg-green-500/20 text-green-300 border-green-500';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500';
    }
  };

  const handleDownload = () => {
    const { jsPDF } = jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    const addSection = (title: string, contentFn: () => void) => {
      if (y > 250) {
        pdf.addPage();
        pdf.setFillColor('#222831');
        pdf.rect(0, 0, pageW, pdf.internal.pageSize.getHeight(), 'F');
        y = 20;
      }
      pdf.setFontSize(16);
      pdf.setTextColor('#EEEEEE');
      pdf.text(title, margin, y);
      y += 8;
      pdf.setFontSize(11);
      pdf.setTextColor('#DDDDDD');
      contentFn();
      pdf.setDrawColor('#393E46');
      pdf.line(margin, y, pageW - margin, y);
      y += 8;
    };
    
    // Background
    pdf.setFillColor('#222831');
    pdf.rect(0, 0, pageW, pdf.internal.pageSize.getHeight(), 'F');

    // Header
    pdf.setFontSize(24);
    pdf.setTextColor('#00ADB5');
    pdf.text("AI Threat Intelligence Report", margin, y);
    y += 15;

    // Assessment
    addSection("AI Threat Assessment", () => {
        pdf.text(`File: ${fileInfo.name}`, margin, y); y+= 7;
        pdf.text(`Prediction: ${prediction}       Risk Score: ${riskScore}/100`, margin, y); y += 7;
        const summaryLines = pdf.splitTextToSize(`Summary: ${summary}`, pageW - margin * 2);
        pdf.text(summaryLines, margin, y);
        y += summaryLines.length * 5 + 5;
    });
    
    // IOCs
    addSection("Indicators of Compromise (IOCs)", () => {
        iocs.forEach(ioc => {
            const iocText = `${ioc.type}: ${ioc.value} ${ioc.reputation ? `(${ioc.reputation})` : ''}`;
            const lines = pdf.splitTextToSize(iocText, pageW - margin * 2);
            pdf.text(lines, margin, y);
            y += lines.length * 5 + 2;
        });
    });

    // Simulated Behavior
    addSection("Simulated Dynamic Behavior", () => {
        simulatedBehavior.forEach(line => {
             const lines = pdf.splitTextToSize(`- ${line}`, pageW - margin * 2 - 5);
             pdf.text(lines, margin + 5, y);
             y += lines.length * 5 + 2;
        });
    });

    // ATT&CK Tactics
    addSection("MITRE ATT&CK® Tactics", () => {
        attackTactics.forEach(tactic => {
            pdf.setTextColor('#00ADB5');
            pdf.text(`${tactic.id} - ${tactic.name}`, margin, y); y += 6;
            pdf.setTextColor('#DDDDDD');
            const lines = pdf.splitTextToSize(tactic.description, pageW - margin * 2);
            pdf.text(lines, margin, y);
            y += lines.length * 5 + 4;
        });
    });

    // Recommendations
     addSection("Recommendations", () => {
        recommendations.forEach(line => {
             const lines = pdf.splitTextToSize(`- ${line}`, pageW - margin * 2 - 5);
             pdf.text(lines, margin + 5, y);
             y += lines.length * 5 + 2;
        });
    });
    
    pdf.save(`threat_report_${fileInfo.name}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-brand-primary">Threat Intelligence Report</h2>
                <p className="text-gray-400">Comprehensive results for <span className="font-mono text-brand-primary/80">{fileInfo.name}</span></p>
            </div>
            <div className="flex items-center gap-2">
                 <button 
                  onClick={handleDownload}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition-colors flex items-center gap-2">
                    <DownloadIcon className="w-5 h-5" />
                    Download PDF
                </button>
            </div>
        </div>
      
      <div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-3 bg-brand-secondary/30 rounded-lg p-6 border border-brand-primary/30">
                <div className="flex items-center gap-3 mb-4">
                    <BrainIcon className="w-8 h-8 text-brand-primary"/>
                    <h3 className="text-2xl font-semibold">AI Threat Assessment</h3>
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="text-gray-400">Prediction</p>
                        <span className={`px-4 py-1 text-lg font-bold rounded-full border ${getPredictionPillClasses(prediction)}`}>
                            {prediction}
                        </span>
                    </div>
                    <div className="w-full md:w-1/3">
                        <p className={`text-gray-400 text-right font-mono ${getRiskColor(riskScore)}`}>{riskScore}/100</p>
                        <div className="w-full bg-gray-700 rounded-full h-4">
                            <div className={`${getRiskBgColor(riskScore)} h-4 rounded-full transition-all duration-500`} style={{ width: `${riskScore}%` }}></div>
                        </div>
                        <p className="text-right font-semibold text-lg ${getRiskColor(riskScore)}">Risk Score</p>
                    </div>
                </div>
                <div className="mt-4 text-gray-300 bg-black/20 p-4 rounded-md">
                    <p className="font-semibold text-brand-text mb-1">Executive Summary:</p>
                    <p>{summary}</p>
                </div>
            </div>

            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ResultCard icon={<NetworkIcon/>} title="Indicators of Compromise">
                    <div className="h-48 overflow-y-auto font-mono text-xs pr-2">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-brand-secondary">
                                    <th className="py-1">Type</th>
                                    <th className="py-1">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {iocs.map((ioc, i) => (
                                    <tr key={i} className="border-b border-brand-secondary/50">
                                        <td className="py-1.5 pr-2 align-top">{ioc.type}</td>
                                        <td className="py-1.5 break-all">
                                            {ioc.value}
                                            {ioc.reputation && <span className={`block text-xs ${ioc.reputation.toLowerCase() === 'malicious' ? 'text-red-400' : 'text-gray-400'}`}>({ioc.reputation})</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ResultCard>

                <ResultCard icon={<ActivityIcon />} title="Simulated Dynamic Behavior">
                    <ul className="space-y-2 text-sm list-disc list-inside h-48 overflow-y-auto pr-2">
                        {simulatedBehavior.map((line, i) => <li key={i}>{line}</li>)}
                    </ul>
                </ResultCard>

                <ResultCard icon={<AlertTriangleIcon />} title="Identified Threats">
                    <ul className="space-y-2 text-sm list-disc list-inside h-48 overflow-y-auto pr-2">
                        {threats.map((threat, i) => <li key={i}>{threat}</li>)}
                    </ul>
                </ResultCard>

                <ResultCard icon={<ShieldCheckIcon />} title="Recommendations">
                    <ul className="space-y-2 text-sm list-disc list-inside h-48 overflow-y-auto pr-2">
                        {recommendations.map((rec, i) => <li key={i} className="text-green-300">{rec}</li>)}
                    </ul>
                </ResultCard>
            </div>
            
            <div className="xl:col-span-1 space-y-6">
                <ResultCard icon={<TargetIcon />} title="MITRE ATT&CK® Tactics">
                    <div className="space-y-3 h-full overflow-y-auto pr-2">
                        {attackTactics.length > 0 ? attackTactics.map((tactic) => (
                            <div key={tactic.id}>
                                <p className="font-semibold text-brand-primary">{tactic.id} - {tactic.name}</p>
                                <p className="text-xs text-gray-400">{tactic.description}</p>
                            </div>
                        )) : <p className="text-gray-400">No specific tactics identified.</p>}
                    </div>
                </ResultCard>
            </div>
            
            <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ResultCard icon={<FileIcon/>} title="File Information">
                    <ul className="space-y-2 text-sm font-mono">
                        <li><strong>Name:</strong> <span className="break-all">{fileInfo.name}</span></li>
                        <li><strong>Size:</strong> {(fileInfo.size / 1024).toFixed(2)} KB</li>
                        <li><strong>Type:</strong> {fileInfo.type || 'unknown'}</li>
                        <li><strong>Modified:</strong> {fileInfo.lastModified}</li>
                    </ul>
                </ResultCard>
                 <ResultCard icon={<BarChartIcon />} title="Entropy">
                    <p className="text-3xl font-bold text-brand-primary">{entropy.toFixed(4)}</p>
                    <div className="w-full bg-gray-700 rounded-full h-4 my-2">
                        <div className="bg-brand-primary h-4 rounded-full" style={{ width: `${(entropy / 8) * 100}%` }}></div>
                    </div>
                    <p className="text-gray-400 text-sm">
                        {entropy > 7.5 ? 'High (potentially packed/encrypted)' : entropy < 6 ? 'Low (potentially simple/text-based)' : 'Normal'}
                    </p>
                </ResultCard>

                {archiveContents && (
                    <ResultCard icon={<ArchiveIcon/>} title="Archive Contents">
                        <div className="h-24 overflow-y-auto bg-black/20 p-2 rounded-md font-mono text-xs text-gray-300">
                            {archiveContents.map((item, i) => <div key={i}>{item}</div>)}
                        </div>
                    </ResultCard>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
