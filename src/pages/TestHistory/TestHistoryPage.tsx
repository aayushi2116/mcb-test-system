import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storage/storageService';
import { useTestStore } from '../../store/testStore';
import { useToastStore } from '../../store/toastStore';
import { TestRecord } from '../../types/test';
import { Button } from '../../components/common/Button';
import {
  Search,
  Download,
  Trash2,
  Eye,
  Filter,
  PlaySquare,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { formatCurrent, formatDate, formatJouleIntegral, formatTimeMs } from '../../utils/formatters';

export const TestHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { loadHistoricalTest } = useTestStore();
  const toast = useToastStore();

  const [tests, setTests] = useState<TestRecord[]>(() => storageService.getTests());
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');
  const [mcbFilter, setMcbFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtered & searched tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchSearch =
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.mcb.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.mcb.modelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.operator.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchResult =
        resultFilter === 'ALL' || t.result?.overallResult === resultFilter;

      const matchMcb =
        mcbFilter === 'ALL' || t.mcb.manufacturer.toLowerCase() === mcbFilter.toLowerCase();

      return matchSearch && matchResult && matchMcb;
    });
  }, [tests, searchTerm, resultFilter, mcbFilter]);

  const totalPages = Math.ceil(filteredTests.length / pageSize) || 1;
  const paginatedTests = filteredTests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenTest = (record: TestRecord) => {
    loadHistoricalTest(record);
    toast.info('Historical Record Loaded', `Loaded ${record.id}`);
    navigate('/new-test/results');
  };

  const handleDeleteTest = (id: string) => {
    if (window.confirm(`Are you sure you want to permanently delete test record ${id}?`)) {
      storageService.deleteTest(id);
      setTests(storageService.getTests());
      toast.success('Record Deleted', `Removed ${id} from database.`);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Test ID',
      'Date',
      'Manufacturer',
      'Model',
      'Poles',
      'Curve',
      'Rated Current (A)',
      'Prospective Current (A)',
      'Power Factor',
      'Peak Current (A)',
      'Joule Integral (A2s)',
      'Interruption Time (ms)',
      'Result',
      'Operator',
    ];

    const rows = filteredTests.map((t) => [
      t.id,
      t.createdAt,
      `"${t.mcb.manufacturer}"`,
      `"${t.mcb.modelNumber}"`,
      t.mcb.poles,
      t.mcb.trippingCurve,
      t.mcb.ratedCurrentA,
      t.configuration.prospectiveCurrentA,
      t.configuration.targetPowerFactor,
      t.result?.peakCurrentA || 0,
      t.result?.jouleIntegralA2s || 0,
      t.result?.interruptionTimeMs || 0,
      t.result?.overallResult || 'N/A',
      `"${t.operator.name}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MCB_Test_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV Exported', `Exported ${filteredTests.length} test records.`);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="text-[10px] font-mono text-teal-700 font-bold uppercase tracking-wider">
            LABORATORY RECORD ARCHIVE • SQLITE TEST LEDGER
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Test Record History Database
          </h1>
          <p className="text-xs text-slate-500">
            Audit-grade repository of short-circuit breaking capacity tests, waveforms, and certification results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => navigate('/new-test')}
            leftIcon={<PlaySquare className="w-3.5 h-3.5" />}
          >
            Start New Test
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Test ID, MCB Model, Manufacturer, Operator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">RESULT:</span>
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value as 'ALL' | 'PASS' | 'FAIL')}
                className="bg-white border border-slate-300 rounded py-1 px-2 text-xs font-bold text-slate-800 focus:outline-hidden"
              >
                <option value="ALL">ALL RESULTS</option>
                <option value="PASS">PASS ONLY</option>
                <option value="FAIL">FAIL ONLY</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">BRAND:</span>
              <select
                value={mcbFilter}
                onChange={(e) => setMcbFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded py-1 px-2 text-xs text-slate-800 focus:outline-hidden"
              >
                <option value="ALL">ALL BRANDS</option>
                <option value="Schneider Electric">Schneider Electric</option>
                <option value="ABB">ABB</option>
                <option value="Siemens">Siemens</option>
                <option value="Eaton">Eaton</option>
                <option value="Legrand">Legrand</option>
              </select>
            </div>

            <span className="text-[11px] text-slate-400">
              ({filteredTests.length} matches)
            </span>
          </div>
        </div>

        {/* Database Table */}
        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full min-w-[850px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono text-[10px] uppercase">
                <th className="py-2.5 px-3">Test ID</th>
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Device Under Test (MCB)</th>
                <th className="py-2.5 px-3">Prospective I</th>
                <th className="py-2.5 px-3">Cut-off Ip</th>
                <th className="py-2.5 px-3">I²t Let-Through</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {paginatedTests.map((t) => {
                const isPass = t.result?.overallResult === 'PASS';
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{t.id}</td>
                    <td className="py-2.5 px-3 text-slate-600">{formatDate(t.createdAt)}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-semibold text-slate-900 block">
                        {t.mcb.manufacturer} {t.mcb.modelNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {t.mcb.poles} • Curve {t.mcb.trippingCurve}{t.mcb.ratedCurrentA}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {formatCurrent(t.configuration.prospectiveCurrentA)}
                    </td>
                    <td className="py-2.5 px-3 text-red-600 font-bold">
                      {formatCurrent(t.result?.peakCurrentA || 0)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {formatJouleIntegral(t.result?.jouleIntegralA2s || 0)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPass
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-red-50 text-red-800 border border-red-300'
                        }`}
                      >
                        {t.result?.overallResult || 'N/A'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 truncate max-w-[130px]">
                      {t.operator.name}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 font-sans">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenTest(t)}
                          title="Open Results & Waveform"
                        >
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                        <button
                          onClick={() => handleDeleteTest(t.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="pt-2 flex items-center justify-between text-xs text-slate-600 font-mono">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredTests.length)} of {filteredTests.length} tests
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="px-2 font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
