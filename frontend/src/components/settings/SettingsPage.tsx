'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, Building2, Mail, Shield, Bell, FileText, Settings as SettingsIcon } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { settingsApi, type Settings } from '@/lib/settingsApi';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';

interface ToggleProps {
  value: string;
  onChange: (v: string) => void;
  label: string;
  description?: string;
}
function Toggle({ value, onChange, label, description }: ToggleProps) {
  const on = value === 'true';
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(on ? 'false' : 'true')}
        className={`relative w-10 h-5.5 rounded-full transition-all ${on ? 'bg-brand-500' : 'bg-white/15'}`}
        aria-checked={on}
        role="switch"
      >
        <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4.5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

type Tab = 'company' | 'invoice' | 'security' | 'notifications';

export function SettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('company');
  const [local, setLocal] = useState<Settings>({});
  const [dirty, setDirty] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getAll,
  });

  useEffect(() => {
    if (settings) { setLocal(settings); setDirty(false); }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved');
      setDirty(false);
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const set = (key: string, value: string) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const save = () => mutation.mutate(local);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'company', label: 'Company', icon: <Building2 className="w-4 h-4" /> },
    { id: 'invoice', label: 'Invoice', icon: <FileText className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Alerts', icon: <Bell className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl">
        <PageHeader
          title="Settings"
          subtitle="Configure system behaviour and preferences"
          icon={SettingsIcon}
          gradient="from-slate-500 to-gray-600"
          actions={
            dirty ? (
              <Button
                variant="brand"
                size="sm"
                leftIcon={<Save className="w-3.5 h-3.5" />}
                onClick={save}
                isLoading={mutation.isPending}
              >
                Save Changes
              </Button>
            ) : undefined
          }
        />

        {/* Tab bar */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 flex-1 justify-center py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white shadow-brand'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Company */}
        {activeTab === 'company' && (
          <Card>
            <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Company Name"
                value={local['company_name'] ?? ''}
                onChange={(e) => set('company_name', e.target.value)}
              />
              <Input
                label="Company Address"
                value={local['company_address'] ?? ''}
                onChange={(e) => set('company_address', e.target.value)}
              />
              <Input
                label="Company Logo URL"
                placeholder="https://…"
                value={local['company_logo_url'] ?? ''}
                onChange={(e) => set('company_logo_url', e.target.value)}
              />
            </CardContent>
          </Card>
        )}

        {/* Invoice */}
        {activeTab === 'invoice' && (
          <Card>
            <CardHeader><CardTitle>Invoice Defaults</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Invoice Number Prefix"
                value={local['invoice_prefix'] ?? 'INV'}
                onChange={(e) => set('invoice_prefix', e.target.value)}
                hint="Invoices will be numbered as PREFIX-YEAR-0001"
              />
              <Input
                label="Default Tax Rate (%)"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={local['default_tax_rate'] ?? '0'}
                onChange={(e) => set('default_tax_rate', e.target.value)}
              />
              <Input
                label="Reminder Days (comma separated)"
                value={local['reminder_intervals'] ?? '[1, 3, 7]'}
                onChange={(e) => set('reminder_intervals', e.target.value)}
                hint="Days before due date to send reminders, e.g. [1, 3, 7]"
              />
            </CardContent>
          </Card>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <Card>
            <CardHeader><CardTitle>Security Policy</CardTitle></CardHeader>
            <CardContent className="space-y-2 divide-y divide-white/5">
              <div className="pb-3 space-y-3">
                <Input
                  label="Minimum Password Length"
                  type="number" min={6} max={32}
                  value={local['password_min_length'] ?? '8'}
                  onChange={(e) => set('password_min_length', e.target.value)}
                />
                <Input
                  label="Max Login Attempts Before Lockout"
                  type="number" min={3} max={20}
                  value={local['max_login_attempts'] ?? '5'}
                  onChange={(e) => set('max_login_attempts', e.target.value)}
                />
                <Input
                  label="Lockout Duration (minutes)"
                  type="number" min={5} max={1440}
                  value={local['lockout_duration_minutes'] ?? '30'}
                  onChange={(e) => set('lockout_duration_minutes', e.target.value)}
                />
              </div>
              <div className="pt-3 space-y-1">
                <Toggle value={local['password_require_uppercase'] ?? 'true'} onChange={(v) => set('password_require_uppercase', v)} label="Require uppercase letter" />
                <Toggle value={local['password_require_number'] ?? 'true'} onChange={(v) => set('password_require_number', v)} label="Require number" />
                <Toggle value={local['password_require_special'] ?? 'true'} onChange={(v) => set('password_require_special', v)} label="Require special character" />
                <Toggle value={local['2fa_required_for_admin'] ?? 'false'} onChange={(v) => set('2fa_required_for_admin', v)} label="Require 2FA for admins" description="Admins must have 2FA enabled to log in" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications / Alerts */}
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader><CardTitle>Alert Settings</CardTitle></CardHeader>
            <CardContent className="space-y-1 divide-y divide-white/5">
              <Toggle
                value={local['low_stock_alert_enabled'] ?? 'true'}
                onChange={(v) => set('low_stock_alert_enabled', v)}
                label="Low Stock Alerts"
                description="Send notification and email when product stock falls below threshold"
              />
            </CardContent>
          </Card>
        )}

        {dirty && (
          <div className="flex justify-end">
            <Button variant="brand" leftIcon={<Save className="w-4 h-4" />} onClick={save} isLoading={mutation.isPending}>
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
