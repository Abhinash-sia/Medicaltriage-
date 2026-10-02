'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  RefreshCw,
  UserCheck,
  UserX,
  Globe,
  UserPlus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Building2,
  KeyRound,
  Stethoscope,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface UserItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  facilityId?: string;
  preferredLanguage?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
}

interface CreatedStaffCredentials {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  password: string;
  facilityId?: string;
}

export function UserManagementPanel() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Staff Provisioning Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [staffName, setStaffName] = useState<string>('');
  const [staffRole, setStaffRole] = useState<string>('DOCTOR');
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffPhone, setStaffPhone] = useState<string>('');
  const [staffFacility, setStaffFacility] = useState<string>('FAC-DH-CUTTACK');
  const [staffPassword, setStaffPassword] = useState<string>('');
  const [showStaffPassword, setShowStaffPassword] = useState<boolean>(false);
  const [staffLanguage, setStaffLanguage] = useState<string>('en');
  const [isSubmittingStaff, setIsSubmittingStaff] = useState<boolean>(false);
  const [staffModalError, setStaffModalError] = useState<string | null>(null);
  const [createdStaff, setCreatedStaff] = useState<CreatedStaffCredentials | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState<boolean>(false);

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  const getAuthHeader = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('isActive', statusFilter);
      params.append('limit', '50');

      const res = await fetch(`${getApiUrl()}/admin/users?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUsers(json.data);
        }
      } else {
        setError('Failed to load users list');
      }
    } catch {
      setError('Network connection error');
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (user: UserItem) => {
    setActionLoadingId(user.id);
    setMessage(null);
    setError(null);
    try {
      const endpoint = user.isActive ? 'deactivate' : 'reactivate';
      const res = await fetch(`${getApiUrl()}/admin/users/${user.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setMessage(`User ${user.name} successfully ${user.isActive ? 'deactivated' : 'reactivated'}`);
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, isActive: !user.isActive } : u))
          );
        }
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error?.message || `Failed to ${user.isActive ? 'deactivate' : 'reactivate'} user`);
      }
    } catch {
      setError('Network connection error during user update');
    } finally {
      setActionLoadingId(null);
    }
  };

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let res = 'Doc#';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setStaffPassword(res);
  };

  const handleOpenCreateModal = () => {
    setStaffName('');
    setStaffRole('DOCTOR');
    setStaffEmail('');
    setStaffPhone('');
    setStaffFacility('FAC-DH-CUTTACK');
    generateStrongPassword();
    setStaffModalError(null);
    setCreatedStaff(null);
    setCopiedCredentials(false);
    setIsCreateModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      setStaffModalError('Staff name is required.');
      return;
    }
    if (!staffEmail.trim() && !staffPhone.trim()) {
      setStaffModalError('Either official email or phone number is required.');
      return;
    }
    if (!staffPassword || staffPassword.length < 8) {
      setStaffModalError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmittingStaff(true);
    setStaffModalError(null);

    try {
      const res = await fetch(`${getApiUrl()}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          name: staffName.trim(),
          role: staffRole,
          email: staffEmail.trim() || undefined,
          phone: staffPhone.trim() || undefined,
          facilityId: staffFacility.trim() || undefined,
          password: staffPassword,
          preferredLanguage: staffLanguage,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to provision staff member.');
      }

      setCreatedStaff({
        name: staffName.trim(),
        role: staffRole,
        email: staffEmail.trim() || undefined,
        phone: staffPhone.trim() || undefined,
        password: staffPassword,
        facilityId: staffFacility,
      });

      fetchUsers();
    } catch (err: any) {
      setStaffModalError(err.message || 'Error creating staff user.');
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdStaff) return;
    const text = `MedicalTriage Staff Credentials:
Name: ${createdStaff.name}
Role: ${createdStaff.role}
Login: ${createdStaff.email || createdStaff.phone}
Password: ${createdStaff.password}
Facility: ${createdStaff.facilityId || 'General'}
Portal: ${typeof window !== 'undefined' ? window.location.origin : ''}/login`;

    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'DOCTOR':
      case 'MEDICAL_OFFICER':
        return 'default';
      case 'NURSE':
      case 'HEALTH_WORKER':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              User Accounts & Role Management
            </CardTitle>
            <CardDescription className="text-xs">
              Manage operational user accounts, facility assignments, and activation status
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by role"
            >
              <option value="">All Roles</option>
              <option value="DOCTOR">Doctor</option>
              <option value="MEDICAL_OFFICER">Medical Officer</option>
              <option value="NURSE">Nurse</option>
              <option value="HEALTH_WORKER">Health Worker</option>
              <option value="PATIENT">Patient</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={isLoading}
              className="h-8 px-2.5 text-xs"
              aria-label="Refresh user list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              size="sm"
              onClick={handleOpenCreateModal}
              className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Provision Staff</span>
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
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Facility</th>
                <th className="px-4 py-3">Lang</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No users matching criteria
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {u.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getRoleBadgeVariant(u.role)} className="text-[10px] font-mono">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <div>{u.email || '-'}</div>
                      <div className="text-[11px] text-slate-400">{u.phone || ''}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                      {u.facilityId || 'DEFAULT'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-mono text-slate-500 uppercase text-[11px]">
                        <Globe className="w-3 h-3" />
                        {u.preferredLanguage || 'en'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
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
                      {u.role !== 'ADMIN' && (
                        <Button
                          size="sm"
                          variant={u.isActive ? 'destructive' : 'outline'}
                          onClick={() => handleToggleActive(u)}
                          disabled={actionLoadingId === u.id}
                          className="h-7 px-2.5 text-xs"
                          aria-label={`${u.isActive ? 'Deactivate' : 'Reactivate'} user ${u.name}`}
                        >
                          {actionLoadingId === u.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : u.isActive ? (
                            <>
                              <UserX className="w-3 h-3 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3 mr-1" />
                              Reactivate
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Staff Provisioning Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Provision Clinical / Staff Member
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create authorized login credentials and bind to hospital facility
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {staffModalError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs rounded-lg border border-red-200 dark:border-red-900/50 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{staffModalError}</span>
                </div>
              )}

              {createdStaff ? (
                /* Success & Credentials Handoff Screen */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Staff Account Created Successfully!
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Please copy and securely hand these initial credentials to the staff member:
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 font-medium">Name:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{createdStaff.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 font-medium">Role:</span>
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">{createdStaff.role}</Badge>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 font-medium">Login Identifier:</span>
                      <span className="font-mono text-slate-900 dark:text-slate-100">{createdStaff.email || createdStaff.phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 font-medium">Assigned Facility:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{createdStaff.facilityId || 'General'}</span>
                    </div>
                    <div className="flex justify-between py-1 items-center">
                      <span className="text-slate-500 font-medium">Initial Password:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                        {createdStaff.password}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCopyCredentials}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 flex items-center justify-center gap-1.5"
                    >
                      {copiedCredentials ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedCredentials ? 'Credentials Copied!' : 'Copy Login Credentials'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="h-9 text-xs px-4"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                /* Provisioning Form */
                <form onSubmit={handleCreateStaff} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Staff Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="e.g. Dr. Sunita Rao"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Clinical / Admin Role *
                      </label>
                      <select
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="DOCTOR">Doctor (Consultant/Senior)</option>
                        <option value="MEDICAL_OFFICER">Medical Officer (PHC/CHC)</option>
                        <option value="NURSE">Nurse (Triage Assessor)</option>
                        <option value="HEALTH_WORKER">Community Health Worker (ASHA)</option>
                        <option value="ADMIN">System Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Official Hospital Email
                      </label>
                      <input
                        type="email"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="doctor@hospital.org"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Mobile Phone Number
                      </label>
                      <input
                        type="tel"
                        value={staffPhone}
                        onChange={(e) => setStaffPhone(e.target.value)}
                        placeholder="+919876543210"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Assigned Facility
                      </label>
                      <select
                        value={staffFacility}
                        onChange={(e) => setStaffFacility(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="FAC-DH-CUTTACK">FAC-DH-CUTTACK (District Hospital Cuttack)</option>
                        <option value="FAC-SCB-MCH">FAC-SCB-MCH (SCB Medical College & Hospital)</option>
                        <option value="FAC-CHC-BANKI">FAC-CHC-BANKI (Community Health Centre Banki)</option>
                        <option value="FAC-PHC-SALIPUR">FAC-PHC-SALIPUR (Primary Health Centre Salipur)</option>
                        <option value="FAC-HQ-ADMIN">FAC-HQ-ADMIN (Command & Operations HQ)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Preferred UI Language
                      </label>
                      <select
                        value={staffLanguage}
                        onChange={(e) => setStaffLanguage(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिंदी (Hindi)</option>
                        <option value="or">ଓଡ଼ିଆ (Odia)</option>
                        <option value="bn">বাংলা (Bengali)</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                        <option value="te">తెలుగు (Telugu)</option>
                        <option value="mr">मराठी (Marathi)</option>
                        <option value="kn">ಕನ್ನಡ (Kannada)</option>
                        <option value="ml">മലയാളം (Malayalam)</option>
                        <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                        <option value="gu">ગુજરાતી (Gujarati)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Initial Password *
                      </label>
                      <button
                        type="button"
                        onClick={generateStrongPassword}
                        className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 font-medium"
                      >
                        <Sparkles className="w-3 h-3" />
                        Generate Strong Password
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showStaffPassword ? 'text' : 'password'}
                        required
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        className="w-full text-xs pl-9 pr-10 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPassword((p) => !p)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      disabled={isSubmittingStaff}
                      className="text-xs h-9"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingStaff}
                      className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
                    >
                      {isSubmittingStaff ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Provisioning...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Provision Staff Member</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
