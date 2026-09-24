'use client';

import React, { useEffect, useState } from 'react';

export interface ReferralItem {
  id: string;
  referralCode: string;
  caseId: string;
  originatingFacilityId: string;
  destinationFacilityId: string;
  destinationDepartment?: string | null;
  referringReviewerName: string;
  referringReviewerRole: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  reason: string;
  summary: string;
  destinationNotes?: string | null;
  statusHistory?: Array<{ status: string; updatedBy: string; updatedAt: string; notes?: string }>;
  createdAt: string;
}

interface ReferralHistoryViewProps {
  caseId: string;
  authToken?: string;
}

export const ReferralHistoryView: React.FC<ReferralHistoryViewProps> = ({ caseId, authToken }) => {
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReferrals() {
      try {
        setLoading(true);
        const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
        const res = await fetch(`/api/referrals/cases/${caseId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setReferrals(json.data || []);
        } else {
          setError(json.error?.message || 'Failed to load referral history');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching referral history');
      } finally {
        setLoading(false);
      }
    }

    if (caseId) {
      fetchReferrals();
    }
  }, [caseId, authToken]);

  if (loading) {
    return <div className="text-slate-400 text-sm py-4">Loading referral history...</div>;
  }

  if (error) {
    return <div className="text-rose-400 text-sm py-2">Note: {error}</div>;
  }

  if (referrals.length === 0) {
    return <div className="text-slate-500 text-sm py-2 italic">No referrals recorded for this case.</div>;
  }

  return (
    <div className="space-y-4">
      {referrals.map((ref) => (
        <div key={ref.id} className="p-4 bg-slate-900/60 rounded-lg border border-slate-700/60 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-cyan-400 font-semibold">{ref.referralCode}</span>
            <span
              className={`px-2 py-0.5 text-xs rounded font-medium ${
                ref.status === 'ACCEPTED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : ref.status === 'COMPLETED'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : ref.status === 'REJECTED' || ref.status === 'CANCELLED'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {ref.status}
            </span>
          </div>

          <div className="text-slate-300 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">From:</span> {ref.originatingFacilityId}
            </div>
            <div>
              <span className="text-slate-500">To:</span> {ref.destinationFacilityId}{' '}
              {ref.destinationDepartment ? `(${ref.destinationDepartment})` : ''}
            </div>
            <div>
              <span className="text-slate-500">Referring Reviewer:</span> {ref.referringReviewerName} ({ref.referringReviewerRole})
            </div>
            <div>
              <span className="text-slate-500">Date:</span> {new Date(ref.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-slate-300">
            <div className="font-medium text-xs text-slate-400">Reason:</div>
            <p className="text-xs text-slate-200 mt-0.5">{ref.reason}</p>
          </div>

          <div className="text-slate-300">
            <div className="font-medium text-xs text-slate-400">Summary:</div>
            <p className="text-xs text-slate-200 mt-0.5">{ref.summary}</p>
          </div>

          {ref.destinationNotes && (
            <div className="p-2 bg-slate-800/80 rounded text-xs text-emerald-300 mt-2">
              <span className="font-semibold">Destination Response:</span> {ref.destinationNotes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
