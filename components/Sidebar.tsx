import React from 'react';
import type { HistoryItem } from '../types';
import { PlusIcon, HistoryIcon } from './Icons';

interface SidebarProps {
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onNewScan: () => void;
  activeId: string | null;
}

const getPredictionColor = (prediction: HistoryItem['prediction']) => {
    switch(prediction) {
        case 'Malicious': return 'bg-red-500';
        case 'Suspicious': return 'bg-yellow-500';
        case 'Safe': return 'bg-green-500';
        default: return 'bg-gray-500';
    }
}

export const Sidebar: React.FC<SidebarProps> = ({ history, onSelectHistory, onNewScan, activeId }) => {
  return (
    <div className="w-64 bg-brand-secondary/20 border-r border-brand-secondary flex flex-col">
      <div className="p-4 border-b border-brand-secondary">
        <button
          onClick={onNewScan}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-teal-400 transition-colors"
        >
          <PlusIcon />
          New Scan
        </button>
      </div>
      <div className="p-4 flex items-center gap-2 text-gray-400">
        <HistoryIcon />
        <h2 className="text-sm font-semibold uppercase tracking-wider">Analysis History</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
            <p className="text-center text-gray-500 text-sm p-4">No scans yet.</p>
        ) : (
            <ul className="space-y-1 px-2">
                {history.map(item => (
                    <li key={item.id}>
                        <button
                            onClick={() => onSelectHistory(item)}
                            className={`w-full text-left p-2 rounded-md transition-colors text-sm flex items-start gap-2 ${activeId === item.id ? 'bg-brand-primary/20 text-brand-primary' : 'hover:bg-brand-secondary/50'}`}
                        >
                            <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${getPredictionColor(item.prediction)}`}></div>
                            <div>
                                <p className="font-semibold break-all">{item.fileName}</p>
                                <p className={`text-xs ${activeId === item.id ? 'text-gray-300' : 'text-gray-400'}`}>{new Date(item.timestamp).toLocaleString()}</p>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        )}
      </div>
    </div>
  );
};
