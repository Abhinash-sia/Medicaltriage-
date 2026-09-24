'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface RetentionStatus {
  clinicalCaseCount: number;
  mediaBlobCount: number;
  aiDerivedCount: number;
  auditLogCount: number;
  eligiblePurgeCount: number;
  failedFileCleanupCount: number;
  disclaimer: string;
}

interface RetentionPurgePanelProps {
  authToken: string;
}

export const RetentionPurgePanel: React.FC<RetentionPurgePanelProps> = ({ authToken }) => {
  const [status, setStatus] = useState<RetentionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [purgeResult, setPurgeResult] = useState<any | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [purging, setPurging] = useState<boolean>(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/retention/status', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setStatus(json.data);
      } else {
        setError(json.error?.message || 'Failed to fetch retention status');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching retention status');
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) {
      fetchStatus();
    }
  }, [authToken, fetchStatus]);

  const handleExecutePurge = async (dryRun: boolean) => {
    try {
      setPurging(true);
      const res = await fetch('/api/admin/retention/purge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ dryRun }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPurgeResult(json.data);
        fetchStatus();
      } else {
        setError(json.error?.message || 'Purge execution failed');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing purge');
    } finally {
      setPurging(false);
      setConfirmModalOpen(false);
    }
  };

  const handleRetryFailed = async () => {
    try {
      const res = await fetch('/api/admin/retention/retry-failed-purges', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        fetchStatus();
      }
    } catch (_) {}
  };

  if (loading) {
    return <div className="p-4 text-slate-400 text-sm">Loading retention status...</div>;
  }

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6 text-sm text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Retention & Purge Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configurable engineering retention defaults for clinical data and media cleanup.
          </p>
        </div>
        <span className="px-2.5 py-1 text-xs rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
          ADMIN ONLY
        </span>
      </div>

      {status?.disclaimer && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded text-xs leading-relaxed">
          <span className="font-semibold">Disclaimer:</span> {status.disclaimer}
        </div>
      )}

      {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-xs">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-lg">
          <div className="text-xs text-slate-400">Clinical Cases</div>
          <div className="text-xl font-bold text-white mt-1">{status?.clinicalCaseCount || 0}</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-lg">
          <div className="text-xs text-slate-400">Media Blobs</div>
          <div className="text-xl font-bold text-white mt-1">{status?.mediaBlobCount || 0}</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-lg">
          <div className="text-xs text-slate-400">AI Derived Notes</div>
          <div className="text-xl font-bold text-white mt-1">{status?.aiDerivedCount || 0}</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-lg">
          <div className="text-xs text-slate-400">Purge Eligible Cases</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{status?.eligiblePurgeCount || 0}</div>
        </div>
      </div>

      {status && status.failedFileCleanupCount > 0 && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-xs flex items-center justify-between">
          <span>Failed file cleanups detected ({status.failedFileCleanupCount} records requiring retry)</span>
          <button
            onClick={handleRetryFailed}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium text-xs"
          >
            Retry Cleanup
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => handleExecutePurge(true)}
          disabled={purging}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs"
        >
          Execute Dry Run
        </button>
        <button
          onClick={() => setConfirmModalOpen(true)}
          disabled={purging || status?.eligiblePurgeCount === 0}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg text-xs disabled:opacity-50"
        >
          Execute Administrative Data Purge
        </button>
      </div>

      {purgeResult && (
        <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg text-xs space-y-2">
          <div className="font-semibold text-white">Purge Execution Result</div>
          <div className="grid grid-cols-3 gap-2 text-slate-300 font-mono">
            <div>Purged Cases: {purgeResult.purgedCases}</div>
            <div>Deleted Files: {purgeResult.deletedFiles}</div>
            <div>Failed Files: {purgeResult.failedFiles}</div>
          </div>
        </div>
      )}

      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 p-6 rounded-xl max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-rose-400">Confirm Administrative Data Purge</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action will unlink physical media files and soft-delete/anonymize clinical cases marked RESOLVED or CLOSED older than the retention threshold.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecutePurge(false)}
                disabled={purging}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded text-xs"
              >
                {purging ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
