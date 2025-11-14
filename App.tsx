import React, { useState, useCallback, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { AnalysisResults } from './components/AnalysisResults';
import { Spinner } from './components/Spinner';
import { analyzeFile } from './services/fileAnalyzer';
import { getAIPrediction } from './services/geminiService';
import type { AnalysisResult, HistoryItem } from './types';
import { HeaderIcon } from './components/Icons';
import { Sidebar } from './components/Sidebar';

type View = 'uploader' | 'results' | 'history';

const App: React.FC = () => {
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('uploader');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('analysisHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to parse history from localStorage", e);
      localStorage.removeItem('analysisHistory');
    }
  }, []);

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('analysisHistory', JSON.stringify(newHistory));
  };
  
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (analysisStatus) return;
    
    setError(null);
    setCurrentResult(null);
    setActiveHistoryId(null);
    setView('results');
    setAnalysisStatus('Initializing analysis...');

    try {
      const staticAnalysis = await analyzeFile(selectedFile, (status) => {
        setAnalysisStatus(status);
      });
      
      setAnalysisStatus('Consulting AI model for deep threat intelligence...');
      const aiPrediction = await getAIPrediction(staticAnalysis);
      
      const newResult: AnalysisResult = { ...staticAnalysis, ...aiPrediction };
      setCurrentResult(newResult);

      const newHistoryItem: HistoryItem = {
        id: newResult.hashes.sha256,
        fileName: newResult.fileInfo.name,
        prediction: newResult.prediction,
        riskScore: newResult.riskScore,
        timestamp: new Date().toISOString(),
        result: newResult,
      };

      // Avoid duplicates
      const updatedHistory = [newHistoryItem, ...history.filter(h => h.id !== newHistoryItem.id)];
      saveHistory(updatedHistory.slice(0, 20)); // Keep last 20
      setActiveHistoryId(newHistoryItem.id);

    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
    } finally {
      setAnalysisStatus(null);
    }
  }, [analysisStatus, history]);

  const handleReset = () => {
    setCurrentResult(null);
    setError(null);
    setAnalysisStatus(null);
    setView('uploader');
    setActiveHistoryId(null);
  };
  
  const handleSelectHistory = (item: HistoryItem) => {
    setCurrentResult(item.result);
    setError(null);
    setAnalysisStatus(null);
    setView('results');
    setActiveHistoryId(item.id);
  };

  const isLoading = analysisStatus !== null;

  return (
    <div className="min-h-screen bg-brand-background text-brand-text font-sans flex">
      <Sidebar 
        history={history}
        onSelectHistory={handleSelectHistory}
        onNewScan={handleReset}
        activeId={activeHistoryId}
      />
      <div className="flex-1 flex flex-col">
        <header className="bg-brand-secondary/30 backdrop-blur-sm p-4 border-b border-brand-primary/20 sticky top-0 z-10">
          <div className="container mx-auto flex items-center gap-4">
            <HeaderIcon />
            <h1 className="text-2xl font-bold text-brand-primary">
              AI Threat Intelligence Platform
            </h1>
          </div>
        </header>

        <main className="container mx-auto p-4 md:p-8 flex-1">
          {view === 'uploader' && (
            <FileUploader onFileSelect={handleFileSelect} isLoading={isLoading} />
          )}

          {view === 'results' && (
            <>
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Spinner />
                  <p className="mt-4 text-xl text-brand-primary animate-pulse">{analysisStatus || 'Analyzing...'}</p>
                  <p className="text-gray-400">Performing deep analysis. This may take a moment.</p>
                </div>
              )}

              {error && !isLoading && (
                <div className="text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
                  <h2 className="text-2xl text-red-400 font-bold mb-2">Analysis Failed</h2>
                  <p className="text-red-300">{error}</p>
                  <button
                    onClick={handleReset}
                    className="mt-6 px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-teal-400 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {currentResult && !isLoading && (
                <AnalysisResults result={currentResult} onReset={handleReset} />
              )}
            </>
          )}
        </main>
        
        <footer className="text-center p-4 text-gray-500 text-sm">
          <p>Designed & Developed by Deepak Kumar Saini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
