'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { FileUp, AlertCircle, CheckCircle } from 'lucide-react';

interface ImportSectionProps {
  onImportSuccess: (data: any) => void;
}

export function ImportSection({ onImportSuccess }: ImportSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bankAccount, setBankAccount] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bankAccount', bankAccount || 'Default Account');

      const response = await fetch('/api/reconciliation/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to import transactions');
        return;
      }

      setSuccess(
        `Imported ${data.importedCount} transactions (${data.matchedCount} matched)`
      );
      onImportSuccess(data);

      // Reset form
      setBankAccount('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Import Bank Statement</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload a CSV file from your bank. Supports most common bank formats.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bank Account Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bank Account (optional)
          </label>
          <input
            type="text"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            placeholder="e.g., Current Account, Reserve Fund"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Drag and Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="hidden"
          />

          <FileUp className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900">
            Drop your CSV file here or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="text-indigo-600 hover:text-indigo-700 font-semibold disabled:opacity-50"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            CSV files only. Max 50MB. Date, Amount, Description required.
          </p>

          {isLoading && (
            <div className="mt-4">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
              <p className="text-sm text-gray-600 mt-2">Importing...</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">{success}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
