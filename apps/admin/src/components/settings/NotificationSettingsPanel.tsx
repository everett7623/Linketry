import React, { useEffect, useState } from 'react';
import { BellRing, Save, Send, Trash2 } from 'lucide-react';
import {
  getNotificationConfig,
  testNotificationChannel,
  updateNotificationChannel,
  type NotificationChannelConfig,
  type NotificationProvider,
} from '../../api/notifications';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { useLocale } from '../../contexts/LocaleContext';

interface ChannelDraft extends NotificationChannelConfig {
  credential: string;
}

const PROVIDER_LABELS: Record<NotificationProvider, string> = {
  telegram: 'Telegram',
  discord: 'Discord',
  slack: 'Slack',
  feishu: '飞书 / Feishu',
  dingtalk: '钉钉 / DingTalk',
  wecom: '企业微信 / WeCom',
};

export function NotificationSettingsPanel() {
  const { success, error } = useToast();
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelDraft[]>([]);

  useEffect(() => {
    getNotificationConfig()
      .then((config) => setChannels(config.channels.map((channel) => ({ ...channel, credential: '' }))))
      .catch(() => error(t('notificationLoadFailed')))
      .finally(() => setLoading(false));
  }, [error, t]);

  const updateDraft = (provider: NotificationProvider, fields: Partial<ChannelDraft>) => {
    setChannels((current) => current.map((channel) => (
      channel.provider === provider ? { ...channel, ...fields } : channel
    )));
  };

  const save = async (channel: ChannelDraft) => {
    setBusy(`save:${channel.provider}`);
    try {
      const updated = await updateNotificationChannel(channel.provider, {
        enabled: channel.enabled,
        ...(channel.credential.trim() ? { credential: channel.credential.trim() } : {}),
        ...(channel.provider === 'telegram' ? { target: channel.target.trim() } : {}),
      });
      updateDraft(channel.provider, { ...updated, credential: '' });
      success(t('notificationSaved', { provider: PROVIDER_LABELS[channel.provider] }));
    } catch (e) {
      error(String(e));
    } finally {
      setBusy(null);
    }
  };

  const test = async (channel: ChannelDraft) => {
    setBusy(`test:${channel.provider}`);
    try {
      await testNotificationChannel(channel.provider);
      success(t('notificationDelivered', { provider: PROVIDER_LABELS[channel.provider] }));
    } catch (e) {
      error(String(e));
    } finally {
      setBusy(null);
    }
  };

  const clearCredential = async (channel: ChannelDraft) => {
    setBusy(`clear:${channel.provider}`);
    try {
      const updated = await updateNotificationChannel(channel.provider, {
        enabled: false,
        clearCredential: true,
        ...(channel.provider === 'telegram' ? { target: '' } : {}),
      });
      updateDraft(channel.provider, { ...updated, credential: '' });
      success(t('notificationCredentialCleared', { provider: PROVIDER_LABELS[channel.provider] }));
    } catch (e) {
      error(String(e));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
          <BellRing size={16} /> {t('notificationChannels')}
        </h2>
        <p className="mt-2 text-xs text-slate-500">{t('notificationChannelsHint')}</p>
      </div>

      <div className="space-y-4">
        {channels.map((channel) => (
          <div key={channel.provider} className="space-y-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
            <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
              <span className="font-medium">{PROVIDER_LABELS[channel.provider]}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {channel.configured ? t('configured') : t('notConfigured')}
                </span>
                <input
                  type="checkbox"
                  checked={channel.enabled}
                  onChange={(e) => updateDraft(channel.provider, { enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-brand-600 focus:ring-brand-500"
                />
              </span>
            </label>

            <Input
              label={channel.provider === 'telegram' ? t('telegramBotToken') : t('notificationWebhookUrl')}
              type="password"
              value={channel.credential}
              onChange={(e) => updateDraft(channel.provider, { credential: e.target.value })}
              placeholder={channel.configured ? t('leaveBlankToKeep') : channel.provider === 'telegram' ? '123456:bot-token' : 'https://…'}
            />

            {channel.provider === 'telegram' && (
              <Input
                label={t('telegramChatId')}
                value={channel.target}
                onChange={(e) => updateDraft(channel.provider, { target: e.target.value })}
                placeholder="-1001234567890"
              />
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                icon={<Save size={14} />}
                loading={busy === `save:${channel.provider}`}
                disabled={busy !== null && busy !== `save:${channel.provider}`}
                onClick={() => save(channel)}
              >
                {t('save')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={<Send size={14} />}
                loading={busy === `test:${channel.provider}`}
                disabled={!channel.configured || (busy !== null && busy !== `test:${channel.provider}`)}
                onClick={() => test(channel)}
              >
                {t('sendTest')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={<Trash2 size={14} />}
                loading={busy === `clear:${channel.provider}`}
                disabled={!channel.configured || (busy !== null && busy !== `clear:${channel.provider}`)}
                onClick={() => clearCredential(channel)}
              >
                {t('removeCredential')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
