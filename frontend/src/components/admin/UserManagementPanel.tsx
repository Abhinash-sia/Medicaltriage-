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

export function UserManagementPanel() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    </Card>
  );
}
