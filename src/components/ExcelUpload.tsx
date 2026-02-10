'use client';

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UploadResult {
  success: boolean;
  message: string;
  recordCount?: number;
  uploadId?: number;
  total?: any;
  error?: string;
}

interface ExcelUploadProps {
  onUploadSuccess?: (result: UploadResult) => void;
}

export default function ExcelUpload({ onUploadSuccess }: ExcelUploadProps) {
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Import Excel File</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-border/80'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Uploading and processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-base font-medium">
                  Drag & Drop your Excel file here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Data will be read from cells C29 to H40
                </p>
              </div>
              <label className="cursor-pointer">
                <Button type="button" asChild>
                  <span className='text-black'>Browse Files</span>
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
            className={`flex items-start gap-3 p-4 rounded-lg ${
              uploadResult.success
                ? 'bg-destructive/10 text-destructive'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {uploadResult.success ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1">
              <p className="font-medium">{uploadResult.message}</p>
              {uploadResult.recordCount && (
                <p className="text-sm opacity-75">
                  {uploadResult.recordCount} months imported successfully
                </p>
              )}
              {uploadResult.error && (
                <p className="text-sm opacity-75">{uploadResult.error}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
