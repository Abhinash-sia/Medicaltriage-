'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Globe,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface FacilityItem {
  id?: string;
  _id?: string;
  name: string;
  code: string;
  type: string;
  district?: string;
  state?: string;
  supportedLanguages: string[];
  active: boolean;
}

const AVAILABLE_LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
];

export function FacilityManagementPanel() {
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Edit language state
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [isSavingLanguages, setIsSavingLanguages] = useState<boolean>(false);

  // Create facility modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newFacilityName, setNewFacilityName] = useState<string>('');
  const [newFacilityCode, setNewFacilityCode] = useState<string>('');
  const [newFacilityType, setNewFacilityType] = useState<string>('PHC');
  const [newFacilityDistrict, setNewFacilityDistrict] = useState<string>('');
  const [newFacilityState, setNewFacilityState] = useState<string>('');
  const [newFacilityLanguages, setNewFacilityLanguages] = useState<string[]>(['en', 'hi']);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  const getAuthHeader = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchFacilities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiUrl()}/facilities`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setFacilities(json.data);
        }
      } else {
        setError('Failed to load facilities list');
      }
    } catch {
      setError('Network connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const handleStartEditLanguages = (facility: FacilityItem) => {
    const id = facility.id || facility._id || facility.code;
    setEditingFacilityId(id);
    setSelectedLangs([...facility.supportedLanguages]);
  };

  const handleToggleLang = (code: string) => {
    if (selectedLangs.includes(code)) {
      if (selectedLangs.length === 1) return; // Must have at least 1
      setSelectedLangs(selectedLangs.filter((c) => c !== code));
    } else {
      setSelectedLangs([...selectedLangs, code]);
    }
  };

  const handleSaveLanguages = async (facility: FacilityItem) => {
    setIsSavingLanguages(true);
    setError(null);
    setMessage(null);
    try {
      const id = facility.id || facility._id || facility.code;
      const res = await fetch(`${getApiUrl()}/facilities/${id}/languages`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ supportedLanguages: selectedLangs }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setMessage(`Languages updated for facility ${facility.name}`);
          setFacilities((prev) =>
            prev.map((f) =>
              (f.id === id || f._id === id || f.code === id)
                ? { ...f, supportedLanguages: selectedLangs }
                : f
            )
          );
          setEditingFacilityId(null);
        }
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error?.message || 'Failed to update facility languages');
      }
    } catch {
      setError('Network connection error');
    } finally {
      setIsSavingLanguages(false);
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacilityName || !newFacilityCode) {
      setError('Facility name and code are required');
      return;
    }

    setIsCreating(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${getApiUrl()}/facilities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          name: newFacilityName.trim(),
          code: newFacilityCode.trim().toUpperCase(),
          type: newFacilityType,
          district: newFacilityDistrict.trim() || undefined,
          state: newFacilityState.trim() || undefined,
          supportedLanguages: newFacilityLanguages,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setMessage(`Facility ${newFacilityName} registered successfully`);
          setShowCreateModal(false);
          setNewFacilityName('');
          setNewFacilityCode('');
          setNewFacilityDistrict('');
          setNewFacilityState('');
          fetchFacilities();
        }
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error?.message || 'Failed to register facility');
      }
    } catch {
      setError('Network error creating facility');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              Healthcare Facilities & Language Readiness
            </CardTitle>
            <CardDescription className="text-xs">
              Configure clinic/hospital units and authorized language capabilities for India-oriented triage workflows
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFacilities}
              disabled={isLoading}
              className="h-8 px-2.5 text-xs"
              aria-label="Refresh facilities list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Register Facility
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {message && (
          <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs border-b border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 text-xs border-b border-red-100 dark:border-red-900/50 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Facility Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Supported Languages</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Loading facilities...
                  </td>
                </tr>
              ) : facilities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No facilities registered yet.
                  </td>
                </tr>
              ) : (
                facilities.map((f) => {
                  const fid = f.id || f._id || f.code;
                  const isEditing = editingFacilityId === fid;

                  return (
                    <tr key={fid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {f.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                        {f.code}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {f.type.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {f.district || f.state ? (
                          <span>
                            {f.district ? `${f.district}, ` : ''}
                            {f.state || ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {isEditing ? (
                          <div className="space-y-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                            <div className="flex flex-wrap gap-1.5">
                              {AVAILABLE_LANGUAGES.map((l) => (
                                <button
                                  type="button"
                                  key={l.code}
                                  onClick={() => handleToggleLang(l.code)}
                                  className={`text-[10px] px-2 py-0.5 rounded font-medium border transition-colors ${
                                    selectedLangs.includes(l.code)
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                                  }`}
                                >
                                  {l.code.toUpperCase()} - {l.name}
                                </button>
                              ))}
                            </div>
                            <div className="flex justify-end gap-1 pt-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingFacilityId(null)}
                                className="h-6 px-2 text-[11px]"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveLanguages(f)}
                                disabled={isSavingLanguages}
                                className="h-6 px-2 text-[11px] bg-blue-600 text-white"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {f.supportedLanguages && f.supportedLanguages.length > 0 ? (
                              f.supportedLanguages.map((code) => (
                                <Badge
                                  key={code}
                                  variant="secondary"
                                  className="text-[10px] uppercase font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                >
                                  {code}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-slate-400">EN, HI</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {f.active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500 font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isEditing && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEditLanguages(f)}
                            className="h-7 px-2 text-xs"
                            aria-label={`Configure languages for ${f.name}`}
                          >
                            <Globe className="w-3 h-3 mr-1" />
                            Languages
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Register Facility Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Register New Facility</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Facility Name *
                </label>
                <input
                  type="text"
                  value={newFacilityName}
                  onChange={(e) => setNewFacilityName(e.target.value)}
                  placeholder="e.g. Sambalpur District Hospital"
                  className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Code *
                  </label>
                  <input
                    type="text"
                    value={newFacilityCode}
                    onChange={(e) => setNewFacilityCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DH-SBP"
                    className="w-full px-3 py-2 border rounded-md uppercase font-mono dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Facility Type *
                  </label>
                  <select
                    value={newFacilityType}
                    onChange={(e) => setNewFacilityType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GOVERNMENT_HOSPITAL">Government Hospital</option>
                    <option value="PHC">PHC</option>
                    <option value="PUBLIC_HEALTH_CAMP">Public Health Camp</option>
                    <option value="COMPANY_CLINIC">Company Clinic</option>
                    <option value="INDUSTRIAL_HEALTH_UNIT">Industrial Health Unit</option>
                    <option value="CAMPUS_HEALTH_CENTER">Campus Health Center</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    District
                  </label>
                  <input
                    type="text"
                    value={newFacilityDistrict}
                    onChange={(e) => setNewFacilityDistrict(e.target.value)}
                    placeholder="e.g. Sambalpur"
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    State
                  </label>
                  <input
                    type="text"
                    value={newFacilityState}
                    onChange={(e) => setNewFacilityState(e.target.value)}
                    placeholder="e.g. Odisha"
                    className="w-full px-3 py-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Supported Languages
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700 max-h-28 overflow-y-auto">
                  {AVAILABLE_LANGUAGES.map((l) => (
                    <button
                      type="button"
                      key={l.code}
                      onClick={() => {
                        if (newFacilityLanguages.includes(l.code)) {
                          if (newFacilityLanguages.length > 1) {
                            setNewFacilityLanguages(newFacilityLanguages.filter((c) => c !== l.code));
                          }
                        } else {
                          setNewFacilityLanguages([...newFacilityLanguages, l.code]);
                        }
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                        newFacilityLanguages.includes(l.code)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {l.code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreating}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isCreating ? 'Registering...' : 'Register'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
