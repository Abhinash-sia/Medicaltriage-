'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Trash2, CheckCircle2, ShieldAlert, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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
  const [confirmPhraseInput, setConfirmPhraseInput] = useState<string>('');
  const [purging, setPurging] = useState<boolean>(false);

  const CONFIRM_PHRASE = 'CONFIRM PURGE';

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
      setConfirmPhraseInput('');
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
    return <div className="p-4 text-muted-foreground text-xs font-mono">Loading retention status...</div>;
  }

  return (
    <div className="space-y-4 text-xs text-foreground">
      {/* Disclaimer Banner */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200 rounded-[6px] flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold text-[11px] uppercase tracking-wider">Engineering Retention Policy Disclaimer</div>
          <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
            {status?.disclaimer ||
              'Data retention rules are non-authoritative engineering controls for software evaluation.'}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-card border border-border rounded-[6px] shadow-2xs">
          <div className="text-[11px] text-muted-foreground font-medium">Clinical Cases</div>
          <div className="text-lg font-mono font-bold text-foreground mt-1 tabular-nums">
            {status?.clinicalCaseCount || 0}
          </div>
        </div>

        <div className="p-3 bg-card border border-border rounded-[6px] shadow-2xs">
          <div className="text-[11px] text-muted-foreground font-medium">Media Blobs</div>
          <div className="text-lg font-mono font-bold text-foreground mt-1 tabular-nums">
            {status?.mediaBlobCount || 0}
          </div>
        </div>

        <div className="p-3 bg-card border border-border rounded-[6px] shadow-2xs">
          <div className="text-[11px] text-muted-foreground font-medium">AI Derived Artifacts</div>
          <div className="text-lg font-mono font-bold text-foreground mt-1 tabular-nums">
            {status?.aiDerivedCount || 0}
          </div>
        </div>

        <div className="p-3 bg-card border border-border rounded-[6px] shadow-2xs">
          <div className="text-[11px] text-muted-foreground font-medium">Purge Eligible Cases</div>
          <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {status?.eligiblePurgeCount || 0}
          </div>
        </div>
      </div>

      {status && status.failedFileCleanupCount > 0 && (
        <div className="p-2.5 bg-destructive/10 border border-destructive/30 text-destructive rounded-[6px] text-xs flex items-center justify-between">
          <span>Failed file cleanups detected ({status.failedFileCleanupCount} records)</span>
          <Button size="sm" variant="destructive" onClick={handleRetryFailed} className="h-7 text-xs">
            Retry Cleanup
          </Button>
        </div>
      )}

      {/* Danger Zone */}
      <div className="p-4 bg-card border border-destructive/40 rounded-[6px] space-y-3">
        <div className="flex items-center gap-2 text-destructive font-semibold text-xs">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone — Privacy & Retention Purge</span>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Administrative purge irrevocably soft-deletes eligible closed/resolved clinical records and unlinks media files according to configured data retention rules.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExecutePurge(true)}
            disabled={purging}
            className="text-xs h-8"
          >
            Execute Dry Run
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => setConfirmModalOpen(true)}
            disabled={purging || status?.eligiblePurgeCount === 0}
            className="text-xs h-8 gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Execute Administrative Purge
          </Button>
        </div>
      </div>

      {purgeResult && (
        <div className="p-3 bg-muted/50 border border-border rounded-[6px] text-xs space-y-1.5 font-mono">
          <div className="font-semibold text-foreground">Purge Execution Result</div>
          <div className="grid grid-cols-3 gap-2 text-muted-foreground">
            <div>Purged Cases: <span className="text-foreground">{purgeResult.purgedCases}</span></div>
            <div>Deleted Files: <span className="text-foreground">{purgeResult.deletedFiles}</span></div>
            <div>Failed Files: <span className="text-foreground">{purgeResult.failedFiles}</span></div>
          </div>
        </div>
      )}

      {/* Purge Confirmation Dialog requiring typed phrase */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Confirm Administrative Data Purge
            </DialogTitle>
            <DialogDescription>
              This action will unlink physical media files and anonymize clinical cases marked RESOLVED or CLOSED older than the retention threshold.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-1">
            <label className="text-xs font-medium text-foreground block">
              Type <span className="font-mono font-bold text-destructive">{CONFIRM_PHRASE}</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmPhraseInput}
              onChange={(e) => setConfirmPhraseInput(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full h-8 px-3 text-xs border border-border bg-card rounded-[5px] text-foreground focus:ring-1 focus:ring-destructive focus:outline-none font-mono"
            />
          </div>

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setConfirmModalOpen(false);
                setConfirmPhraseInput('');
              }}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={confirmPhraseInput !== CONFIRM_PHRASE || purging}
              onClick={() => handleExecutePurge(false)}
              className="h-8 text-xs gap-1.5"
            >
              {purging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {purging ? 'Purging...' : 'Confirm & Purge Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
