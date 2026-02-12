'use client';

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { UploadResult } from '@/types/api';

interface ExcelUploadButtonProps {
  onUploadSuccess?: (result: UploadResult) => void;
}

export default function ExcelUploadButton({ onUploadSuccess }: ExcelUploadButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find((f) =>
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    );

    if (excelFile) {
      setSelectedFile(excelFile);
      setUploadResult(null);
      uploadFile(excelFile);
    } else {
      setUploadResult({
        success: false,
        message: 'Please upload an Excel file (.xlsx or .xls)',
      });
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      uploadFile(file);
    }
  }, []);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result: UploadResult = await response.json();
      setUploadResult(result);

      if (result.success && onUploadSuccess) {
        onUploadSuccess(result);
        setTimeout(() => setOpen(false), 1500);
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Failed to upload file',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="outline" className="claymorphism-btn">
        <Upload className="w-4 h-4 mr-2" />
        Upload
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Import Excel File</DialogTitle>
            <DialogDescription>
              Upload your Excel file to import shipping data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-muted-foreground">Uploading and processing...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <FileSpreadsheet className="w-10 h-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drag & Drop your Excel file here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Data will be read from cells C29 to H40
                    </p>
                  </div>
                  <label className="cursor-pointer">
                    <Button type="button" size="sm" className="claymorphism-btn text-foreground" asChild>
                      <span>Browse Files</span>
                    </Button>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  {selectedFile && (
                    <Badge variant="secondary">
                      Selected: {selectedFile.name}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {uploadResult && (
              <div
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  uploadResult.success
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {uploadResult.success ? (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{uploadResult.message}</p>
                  {uploadResult.recordCount && (
                    <p className="text-xs opacity-75">
                      {uploadResult.recordCount} months imported successfully
                    </p>
                  )}
                  {uploadResult.error && (
                    <p className="text-xs opacity-75">{uploadResult.error}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
