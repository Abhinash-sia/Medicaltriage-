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
    return <div className="text-muted-foreground text-xs py-4">Loading referral history...</div>;
  }

  if (error) {
    return <div className="text-destructive text-xs py-2">Note: {error}</div>;
  }

  if (referrals.length === 0) {
    return <div className="text-muted-foreground text-xs py-2 italic">No referrals recorded for this case.</div>;
  }

  return (
    <div className="space-y-4">
      {referrals.map((ref) => (
        <div key={ref.id} className="p-4 glass-card rounded-lg border border-border text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-primary font-semibold text-xs">{ref.referralCode}</span>
            <span
              className={`px-2 py-0.5 text-xs rounded font-medium ${
                ref.status === 'ACCEPTED'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : ref.status === 'COMPLETED'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : ref.status === 'REJECTED' || ref.status === 'CANCELLED'
                  ? 'bg-destructive/15 text-destructive border border-destructive/30'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {ref.status}
            </span>
          </div>

          <div className="text-foreground grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">From:</span> {ref.originatingFacilityId}
            </div>
            <div>
              <span className="text-muted-foreground">To:</span> {ref.destinationFacilityId}{' '}
              {ref.destinationDepartment ? `(${ref.destinationDepartment})` : ''}
            </div>
            <div>
              <span className="text-muted-foreground">Referring Reviewer:</span> {ref.referringReviewerName} ({ref.referringReviewerRole})
            </div>
            <div>
              <span className="text-muted-foreground">Date:</span> {new Date(ref.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="pt-2 border-t border-border text-foreground">
            <div className="font-medium text-xs text-muted-foreground">Reason:</div>
            <p className="text-xs text-foreground mt-0.5">{ref.reason}</p>
          </div>

          <div className="text-foreground">
            <div className="font-medium text-xs text-muted-foreground">Summary:</div>
            <p className="text-xs text-foreground mt-0.5">{ref.summary}</p>
          </div>

          {ref.destinationNotes && (
            <div className="p-2 bg-muted/50 rounded text-xs text-emerald-600 dark:text-emerald-400 mt-2 border border-border">
              <span className="font-semibold">Destination Response:</span> {ref.destinationNotes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
