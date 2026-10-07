'use client';

import React, { useEffect, useState } from 'react';

export interface AuditTrailItem {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  caseId: string;
  timestamp: string;
  source: string;
  outcome: string;
  metadata?: Record<string, any>;
}

interface AuditTrailModalProps {
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
  authToken?: string;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ caseId, isOpen, onClose, authToken }) => {
  const [auditLogs, setAuditLogs] = useState<AuditTrailItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuditTrail() {
      if (!isOpen || !caseId) return;
      try {
        setLoading(true);
        setError(null);
        const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
        const res = await fetch(`/api/cases/${caseId}/audit-trail`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setAuditLogs(json.data || []);
        } else {
          setError(json.error?.message || 'Failed to load audit trail');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching audit trail');
      } finally {
        setLoading(false);
      }
    }

    fetchAuditTrail();
  }, [isOpen, caseId, authToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel bg-card border border-border w-full max-w-4xl max-h-[85vh] rounded-xl flex flex-col shadow-2xl">
        <div className="p-4 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">Case Audit Trail</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono font-semibold">
              READ-ONLY
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground px-3 py-1 rounded bg-muted hover:bg-muted/80 text-xs transition-colors"
          >
            Close
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading && <div className="text-muted-foreground text-xs py-4">Loading audit logs...</div>}

          {error && <div className="text-destructive text-xs p-3 bg-destructive/10 rounded border border-destructive/20">{error}</div>}

          {!loading && !error && auditLogs.length === 0 && (
            <div className="text-muted-foreground text-xs py-4 italic">No audit records found for this case.</div>
          )}

          {!loading &&
            auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-muted/40 rounded border border-border text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary font-mono">{log.action}</span>
                  <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-foreground">
                  <div>
                    <span className="text-muted-foreground">Actor:</span> {log.actorName}{' '}
                    <span className="text-muted-foreground font-mono">({log.actorRole})</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Resource:</span> {log.resourceType}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Outcome:</span>{' '}
                    <span className={log.outcome === 'SUCCESS' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-destructive font-semibold'}>
                      {log.outcome}
                    </span>
                  </div>
                </div>

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="p-2 bg-card rounded font-mono text-[11px] text-muted-foreground overflow-x-auto border border-border">
                    {JSON.stringify(log.metadata, null, 2)}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
