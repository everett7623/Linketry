import { useState, useEffect } from 'react';
import { apiPost, apiGet, downloadFile } from '../api/client';
import type { ImportJob, NormalizedImportItem } from '@linkora/shared';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';

type PreviewItem = NormalizedImportItem & { _valid: boolean; _errors: string[]; _conflict: boolean };

interface PreviewResult {
  source: string;
  total: number;
  valid: number;
  invalid: number;
  conflicts: number;
  preview: PreviewItem[];
}

interface ConfirmResult {
  jobId: string;
  total: number;
  success: number;
  skipped: number;
  conflicts: number;
  failed: number;
}

export default function ImportExportPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-white">Import / Export</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <ImportSection />
        <ExportSection />
      </div>
      <ImportJobsHistory />
    </div>
  );
}

function ImportSection() {
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [filename, setFilename] = useState('');
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => setContent(reader.result as string);
    reader.readAsText(file);
  }

  async function handlePreview() {
    if (!content.trim()) { setError('Please upload or paste content'); return; }
    setLoading(true);
    setError('');
    setPreview(null);
    setResult(null);
    try {
      const data = await apiPost<PreviewResult>('/api/import/preview', { content, source: source || undefined });
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      const data = await apiPost<ConfirmResult>('/api/import/confirm', { content, source: source || undefined, filename: filename || undefined });
      setResult(data);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Upload className="h-5 w-5 text-brand-400" />
        <h2 className="text-base font-semibold text-white">Import Links</h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-300">Source Type</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
          >
            <option value="">Auto Detect</option>
            <option value="shlink">Shlink</option>
            <option value="generic-csv">Generic CSV</option>
            <option value="generic-json">Generic JSON / JSONL</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Upload File</label>
          <input
            type="file"
            accept=".json,.jsonl,.csv,.txt"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-sm file:text-slate-200 hover:file:bg-slate-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300">Or paste content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="Paste JSON, JSONL, or CSV content..."
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Preview
          </button>
          {preview && (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Confirm Import
            </button>
          )}
        </div>

        {/* Preview Summary */}
        {preview && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
            <p className="text-sm text-white">
              Detected: <span className="font-medium text-brand-400">{preview.source}</span> &middot;{' '}
              Total: {preview.total} &middot; Valid: {preview.valid} &middot; Invalid: {preview.invalid} &middot; Conflicts: {preview.conflicts}
            </p>
            {preview.preview.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto text-xs scrollbar-thin">
                {preview.preview.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 border-t border-slate-700 py-1">
                    {item._valid && !item._conflict ? (
                      <CheckCircle className="h-3 w-3 flex-shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-3 w-3 flex-shrink-0 text-red-400" />
                    )}
                    <span className="text-slate-300">/{item.slug}</span>
                    <span className="truncate text-slate-500">{item.longUrl}</span>
                    {item._conflict && <span className="text-amber-400">(conflict)</span>}
                    {item._errors.length > 0 && <span className="text-red-400">{item._errors.join('; ')}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Import Result */}
        {result && (
          <div className="rounded-lg border border-emerald-600/50 bg-emerald-900/20 p-3">
            <p className="text-sm text-emerald-400">
              Import completed! Success: {result.success}, Skipped: {result.skipped}, Conflicts: {result.conflicts}, Failed: {result.failed}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExportSection() {
  const [downloading, setDownloading] = useState('');

  async function handleExport(format: string) {
    setDownloading(format);
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        await downloadFile('/api/export/links.csv', `linkora-links-${today}.csv`);
      } else if (format === 'json') {
        await downloadFile('/api/export/links.json', `linkora-links-${today}.json`);
      } else if (format === 'backup') {
        await downloadFile('/api/export/backup.json', `linkora-backup-${today}.json`);
      }
    } catch {
      alert('Export failed');
    } finally {
      setDownloading('');
    }
  }

  const exports = [
    { key: 'csv', label: 'Export Links CSV', desc: 'Download all links as CSV' },
    { key: 'json', label: 'Export Links JSON', desc: 'Download all links as JSON' },
    { key: 'backup', label: 'Export Backup', desc: 'Full backup (links, tags, settings)' },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Download className="h-5 w-5 text-emerald-400" />
        <h2 className="text-base font-semibold text-white">Export</h2>
      </div>
      <div className="space-y-3">
        {exports.map((exp) => (
          <button
            key={exp.key}
            onClick={() => handleExport(exp.key)}
            disabled={!!downloading}
            className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-left hover:border-slate-600 disabled:opacity-50"
          >
            <div>
              <p className="text-sm font-medium text-white">{exp.label}</p>
              <p className="text-xs text-slate-400">{exp.desc}</p>
            </div>
            {downloading === exp.key ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <Download className="h-4 w-4 text-slate-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ImportJobsHistory() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<ImportJob[]>('/api/import/jobs')
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || jobs.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-5 py-3">
        <h2 className="text-sm font-semibold text-white">Import History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs font-medium uppercase text-slate-500">
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Success</th>
              <th className="px-4 py-3 text-right">Skipped</th>
              <th className="px-4 py-3 text-right">Failed</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-800/50">
                <td className="px-4 py-2 text-slate-300">{job.source}</td>
                <td className="max-w-[120px] truncate px-4 py-2 text-slate-400">{job.filename ?? '-'}</td>
                <td className="px-4 py-2 text-right text-slate-300">{job.total_count}</td>
                <td className="px-4 py-2 text-right text-emerald-400">{job.success_count}</td>
                <td className="px-4 py-2 text-right text-amber-400">{job.skipped_count}</td>
                <td className="px-4 py-2 text-right text-red-400">{job.failed_count}</td>
                <td className="px-4 py-2">
                  <span className={job.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}>
                    {job.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-slate-500">
                  {dayjs(job.created_at).format('MM/DD HH:mm')}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => downloadFile(`/api/import/jobs/${job.id}/report.csv`, `import-report-${job.created_at.slice(0, 10)}.csv`)}
                    className="text-xs text-brand-400 hover:text-brand-300"
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
