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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[85vh] rounded-xl flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Case Audit Trail</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              READ-ONLY
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sm"
          >
            Close
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading && <div className="text-slate-400 text-sm py-4">Loading audit logs...</div>}

          {error && <div className="text-rose-400 text-sm p-3 bg-rose-500/10 rounded border border-rose-500/20">{error}</div>}

          {!loading && !error && auditLogs.length === 0 && (
            <div className="text-slate-500 text-sm py-4 italic">No audit records found for this case.</div>
          )}

          {!loading &&
            auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-800/60 rounded border border-slate-700/50 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-300 font-mono">{log.action}</span>
                  <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-4 text-slate-300">
                  <div>
                    <span className="text-slate-500">Actor:</span> {log.actorName}{' '}
                    <span className="text-slate-400 font-mono">({log.actorRole})</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Resource:</span> {log.resourceType}
                  </div>
                  <div>
                    <span className="text-slate-500">Outcome:</span>{' '}
                    <span className={log.outcome === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}>
                      {log.outcome}
                    </span>
                  </div>
                </div>

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="p-2 bg-slate-900/80 rounded font-mono text-[11px] text-slate-400 overflow-x-auto">
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
