import React from 'react';
import {
  Activity,
  Archive,
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
  Folder,
  Gauge,
  Globe2,
  KeyRound,
  LayoutDashboard,
  Link2,
  PlusCircle,
  Settings,
  ShieldCheck,
  Shuffle,
  Tags,
} from 'lucide-react';
import type { MessageKey } from '../../i18n/messages';
import type { OptionalModule } from '../../utils/displayPreferences';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: MessageKey;
  advanced?: boolean;
  module?: OptionalModule;
}

interface NavGroup {
  label: MessageKey;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'navDaily',
    items: [
      { to: '/overview', icon: <LayoutDashboard size={18} />, label: 'overview' },
      { to: '/links', icon: <Link2 size={18} />, label: 'links' },
      { to: '/links/create', icon: <PlusCircle size={18} />, label: 'createLink' },
      {
        to: '/links/bulk-create',
        icon: <PlusCircle size={18} />,
        label: 'bulkCreate',
        advanced: true,
        module: 'bulk-create',
      },
      {
        to: '/domains',
        icon: <Globe2 size={18} />,
        label: 'domains',
        advanced: true,
        module: 'domains',
      },
      {
        to: '/groups',
        icon: <Folder size={18} />,
        label: 'groups',
        advanced: true,
        module: 'groups',
      },
      { to: '/tags', icon: <Tags size={18} />, label: 'tags' },
      { to: '/import-export', icon: <ArrowLeftRight size={18} />, label: 'importExport' },
    ],
  },
  {
    label: 'navInsightsAutomation',
    items: [
      {
        to: '/analytics',
        icon: <BarChart3 size={18} />,
        label: 'analytics',
        advanced: true,
        module: 'analytics',
      },
      {
        to: '/redirect-rules',
        icon: <Shuffle size={18} />,
        label: 'redirectRules',
        advanced: true,
        module: 'redirect-rules',
      },
      {
        to: '/health-checks',
        icon: <Activity size={18} />,
        label: 'healthChecks',
        advanced: true,
        module: 'health-checks',
      },
    ],
  },
  {
    label: 'navOperations',
    items: [
      {
        to: '/operations',
        icon: <Gauge size={18} />,
        label: 'operationsDashboard',
        advanced: true,
        module: 'operations',
      },
      {
        to: '/backups',
        icon: <Archive size={18} />,
        label: 'backups',
        advanced: true,
        module: 'backups',
      },
      {
        to: '/api-tokens',
        icon: <KeyRound size={18} />,
        label: 'apiTokens',
        advanced: true,
        module: 'api-tokens',
      },
      {
        to: '/audit-logs',
        icon: <ClipboardList size={18} />,
        label: 'auditLogs',
        advanced: true,
        module: 'audit-logs',
      },
    ],
  },
  {
    label: 'navSystem',
    items: [
      { to: '/setup', icon: <ShieldCheck size={18} />, label: 'setup' },
      { to: '/settings', icon: <Settings size={18} />, label: 'settings' },
    ],
  },
];
