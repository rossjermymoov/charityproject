'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  FileText,
  Download,
  Plus,
  Filter,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useEffect } from 'react';

interface FinancialReport {
  id: string;
  name: string;
  type: string;
  financialYear: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  generatedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SORPReportsPage() {
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showGenerateSOFA, setShowGenerateSOFA] = useState(false);
  const [showGenerateBalanceSheet, setShowGenerateBalanceSheet] = useState(false);
  const [sofaStartDate, setSofaStartDate] = useState('');
  const [sofaEndDate, setSofaEndDate] = useState('');
  const [bsDate, setBsDate] = useState('');
  const [generating, setGenerating] = useState(false);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/finance/reports?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleGenerateSOFA = async () => {
    if (!sofaStartDate || !sofaEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch('/api/finance/reports/generate-sofa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: sofaStartDate,
          endDate: sofaEndDate,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate SOFA');
      setShowGenerateSOFA(false);
      setSofaStartDate('');
      setSofaEndDate('');
      await fetchReports();
    } catch (error) {
      console.error('Error generating SOFA:', error);
      alert('Failed to generate SOFA report');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateBalanceSheet = async () => {
    if (!bsDate) {
      alert('Please select a date');
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch(
        '/api/finance/reports/generate-balance-sheet',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asOfDate: bsDate,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to generate balance sheet');
      setShowGenerateBalanceSheet(false);
      setBsDate('');
      await fetchReports();
    } catch (error) {
      console.error('Error generating balance sheet:', error);
      alert('Failed to generate balance sheet');
    } finally {
      setGenerating(false);
    }
  };

  const typeColors: Record<string, string> = {
    SOFA: 'bg-blue-100 text-blue-800',
    BALANCE_SHEET: 'bg-green-100 text-green-800',
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    REVIEWED: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SORP Financial Reports</h1>
          <p className="text-gray-500 mt-1">
            Generate SORP-compliant financial reports for your charity
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowGenerateSOFA(true)}
          >
            <TrendingUp className="h-4 w-4" />
            Generate SOFA
          </Button>
          <Button
            className="gap-2"
            onClick={() => setShowGenerateBalanceSheet(true)}
          >
            <FileText className="h-4 w-4" />
            Generate Balance Sheet
          </Button>
        </div>
      </div>

      {/* Generate SOFA Modal */}
      {showGenerateSOFA && (
        <Card className="p-6 bg-gray-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-4">Generate SOFA Report</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={sofaStartDate}
                  onChange={(e) => setSofaStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={sofaEndDate}
                  onChange={(e) => setSofaEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleGenerateSOFA}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGenerateSOFA(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Generate Balance Sheet Modal */}
      {showGenerateBalanceSheet && (
        <Card className="p-6 bg-gray-50 border-green-200">
          <h3 className="text-lg font-semibold mb-4">Generate Balance Sheet</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                As At Date
              </label>
              <input
                type="date"
                value={bsDate}
                onChange={(e) => setBsDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleGenerateBalanceSheet}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGenerateBalanceSheet(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Types</option>
            <option value="SOFA">Statement of Financial Activities</option>
            <option value="BALANCE_SHEET">Balance Sheet</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Generate your first SORP financial report to get started"
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {report.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    {formatDate(report.startDate)} to {formatDate(report.endDate)}
                  </p>
                  <div className="flex gap-2">
                    <Badge className={typeColors[report.type] || 'bg-gray-100'}>
                      {report.type === 'SOFA'
                        ? 'Statement of Financial Activities'
                        : 'Balance Sheet'}
                    </Badge>
                    <Badge className={statusColors[report.status] || 'bg-gray-100'}>
                      {report.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-2">
                    By {report.generatedBy.name}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      window.location.href = `/finance/reports/${report.id}`
                    }
                  >
                    <Download className="h-4 w-4" />
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
