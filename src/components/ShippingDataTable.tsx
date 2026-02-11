'use client';

import { useEffect, useState, useMemo } from 'react';
import React from 'react';
import { RefreshCw, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {  Select,  SelectContent,  SelectItem,  SelectTrigger,  SelectValue,} from '@/components/ui/select';
import {  AlertDialog,  AlertDialogAction,  AlertDialogCancel,  AlertDialogContent,  AlertDialogDescription,  AlertDialogFooter,  AlertDialogHeader, AlertDialogTitle,} from '@/components/ui/alert-dialog';
import ExcelUploadButton from '@/components/ExcelUploadButton';
import DeleteButton from '@/components/DeleteButton';

interface ShippingData {
  month: string;
  [key: string]: number | null | string;
}

interface ApiResponse {
  success: boolean;
  data: ShippingData[];
}

interface Upload {
  id: number;
  filename: string;
  upload_date: string;
}

interface UploadsResponse {
  success: boolean;
  data: Upload[];
}

interface YearGroup {
  year: string;
  type: string;
  boxKey: string;
  teusKey: string;
  label: string;
}

export default function ShippingDataTable() {
  const [data, setData] = useState<ShippingData[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [selectedUploadId, setSelectedUploadId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const yearGroups = useMemo(() => {
    if (data.length === 0) return [];

    const keys = Object.keys(data[0]).filter(k => k !== 'month');

    const groups: YearGroup[] = [];

    keys.forEach(key => {
      const match = key.match(/(\d{4})_(\w+)_(box|teus)/);
      if (match) {
        const year = match[1];
        const type = match[2];
        const metric = match[3];

        const existingGroup = groups.find(g => g.year === year && g.type === type);
        if (existingGroup) {
          if (metric === 'box') existingGroup.boxKey = key;
          else existingGroup.teusKey = key;
        } else {
          groups.push({
            year,
            type,
            boxKey: metric === 'box' ? key : '',
            teusKey: metric === 'teus' ? key : '',
            label: `${year} ${type.charAt(0).toUpperCase() + type.slice(1)}`
          });
        }
      }
    });

    return groups.sort((a, b) => {
      const yearA = parseInt(a.year);
      const yearB = parseInt(b.year);
      if (yearA !== yearB) return yearA - yearB;
      return a.type.localeCompare(b.type);
    });
  }, [data]);

  const fetchUploads = async () => {
    try {
      const response = await fetch('/api/uploads');
      const result: UploadsResponse = await response.json();

      if (result.success && result.data.length > 0) {
        setUploads(result.data);

        // Fetch active upload to determine which one to display
        const activeResponse = await fetch('/api/uploads/active');
        const activeResult = await activeResponse.json();

        if (activeResult.success && activeResult.data) {
          setSelectedUploadId(activeResult.data.id.toString());
        } else {
          // Fallback to first upload if no active one
          setSelectedUploadId(result.data[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Failed to fetch uploads:', err);
    }
  }

  const deleteItem = async (id: number) => {
    try {
      const response = await fetch(`/api/uploads/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchUploads();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete failed:', errorData);
        alert(errorData.error || 'Failed to delete uploads');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    }
  };

  const fetchData = async (uploadId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = uploadId
        ? `/api/shipping-data?format=table&uploadId=${uploadId}`
        : '/api/shipping-data?format=table';
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  useEffect(() => {
    if (selectedUploadId) {
      fetchData(selectedUploadId);
    }
  }, [selectedUploadId]);

  const formatNumber = (num: number | null) => {
    if (num === null) return '-';
    return num.toLocaleString();
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = ['Month', ...yearGroups.map(g => `${g.label} - Box`), ...yearGroups.map(g => `${g.label} - TEUS`)];

    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        [
          row.month,
          ...yearGroups.map(g => row[g.boxKey] ?? ''),
          ...yearGroups.map(g => row[g.teusKey] ?? ''),
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shipping-data-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportDialog(false);
  };

  const handleExportClick = () => {
    setShowExportDialog(true);
  };

  return (
    <Card variant="clay">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Shipping Data</CardTitle>
            {uploads.length > 0 && (
              <Select value={selectedUploadId} onValueChange={setSelectedUploadId}>
                <SelectTrigger className="w-75">
                  <SelectValue placeholder="Select upload" />
                </SelectTrigger>
                <SelectContent>
                  {uploads.map((upload) => (
                    <SelectItem key={upload.id} value={upload.id.toString()}>
                      {upload.filename} - {new Date(upload.upload_date).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex gap-2">
            <ExcelUploadButton onUploadSuccess={(result) => {
              fetchUploads();
              fetchData(result.uploadId?.toString());
            }} />
            <Button
              className="claymorphism-btn"
              variant="outline"
              size="sm"
              onClick={() => fetchData(selectedUploadId)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button
              className="claymorphism-btn"
              variant="outline"
              size="sm"
              onClick={handleExportClick}
              disabled={data.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <DeleteButton
              itemName="upload"
              disabled={!selectedUploadId}
              onDelete={async () => {
                await deleteItem(parseInt(selectedUploadId));
              }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <Badge variant="destructive">{error}</Badge>
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No data available. Upload an Excel file to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-primary/5">
                  <th className="py-4 px-4 text-center text-sm font-semibold text-foreground border-r-2 border-foreground/20">
                    Month
                  </th>
                  {yearGroups.map((group, index) => (
                    <th
                      key={`${group.year}-${group.type}`}
                      className="py-4 px-4 text-center text-sm font-semibold text-foreground border-l-2 border-foreground/20"
                      colSpan={2}
                    >
                      {group.label}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-foreground/10 bg-primary/10">
                  <th className="py-2 px-4 text-center text-xs font-medium text-muted-foreground"></th>
                  {yearGroups.map((group, index) => (
                    <React.Fragment key={`${group.year}-${group.type}`}>
                      <th className="py-2 px-4 text-center text-xs font-semibold text-muted-foreground border-l-2 border-foreground/20">
                        Box
                      </th>
                      <th className="py-2 px-4 text-center text-xs font-semibold text-muted-foreground">
                        TEUS
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr
                    key={row.month}
                    className="border-b border-foreground/10"
                  >
                    <td className="py-3 px-4 text-sm font-medium border-r-2 border-foreground/20">
                      {row.month}
                    </td>
                    {yearGroups.map((group, groupIndex) => (
                      <React.Fragment key={`${group.year}-${group.type}`}>
                        <td className="py-3 px-4 text-sm text-center tabular-nums border-l-2 border-foreground/20">
                          {formatNumber((row[group.boxKey] as number | null) ?? null)}
                        </td>
                        <td className="py-3 px-4 text-sm text-center tabular-nums">
                          {formatNumber((row[group.teusKey] as number | null) ?? null)}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {data.length} months of data
            </p>
          </div>
        )}
      </CardContent>

      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export to CSV</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to export {data.length} months of shipping data to CSV?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={exportToCSV}>
              Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
