'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentDropzoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export function DocumentDropzone({ onFileSelect, isUploading = false }: DocumentDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded-[6px] p-5 text-center cursor-pointer transition-all duration-150 ${
          isDragOver
            ? 'border-accent bg-accent/10'
            : 'border-border bg-card/60 hover:bg-muted/60 hover:border-muted-foreground/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-1.5">
          <div className="p-2 rounded-full bg-muted text-muted-foreground">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="text-xs font-medium text-foreground">
            <span className="text-primary font-semibold">Click to upload</span> or drag and drop
          </div>
          <p className="text-[11px] text-muted-foreground">
            Scanned lab reports, discharge summaries or doctor notes (PDF, PNG, JPG up to 10MB)
          </p>
        </div>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between p-2.5 bg-muted/50 border border-border rounded-[5px] text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-foreground truncate">{selectedFile.name}</div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
            }}
            className="p-1 text-muted-foreground hover:text-foreground rounded"
            aria-label="Remove attached file"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
