
import React from 'react';

interface ResultCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const ResultCard: React.FC<ResultCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-brand-secondary/30 rounded-lg p-4 border border-brand-primary/20 h-full">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-brand-primary">{icon}</div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="text-gray-300">
        {children}
      </div>
    </div>
  );
};
