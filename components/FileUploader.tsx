import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const dragDropClasses = isDragging
    ? 'border-brand-primary bg-brand-primary/10 scale-105'
    : 'border-brand-secondary bg-brand-secondary/20 hover:border-brand-primary/70';

  return (
    <div className="max-w-2xl mx-auto flex flex-col justify-center h-full">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${dragDropClasses}`}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <div className="text-center">
          <UploadIcon className={`w-16 h-16 mx-auto mb-4 text-gray-400 transition-colors ${isDragging ? 'text-brand-primary' : ''}`} />
          <p className="mb-2 text-lg font-semibold text-brand-text">
            <span className="text-brand-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400">PDF, DOCX, ZIP, EXE, images, etc.</p>
        </div>
      </div>
      <div className="mt-8 text-center text-gray-400 p-4 bg-brand-secondary/10 rounded-lg border border-brand-secondary">
        <h3 className="font-semibold text-brand-text">How it works:</h3>
        <ol className="list-decimal list-inside text-left mt-2 space-y-1 text-sm">
            <li>Upload any file for deep analysis.</li>
            <li>Our system performs static analysis to extract key features and IOCs.</li>
            <li>An advanced AI model simulates the file's behavior and maps it to the MITRE ATT&CK® framework.</li>
            <li>Review the comprehensive threat intelligence report with actionable recommendations.</li>
        </ol>
      </div>
    </div>
  );
};
