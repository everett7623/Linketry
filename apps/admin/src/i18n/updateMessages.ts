export const updateMessages = {
  en: {
    updateAvailableTitle: 'Linketry {version} is available',
    updateAvailableDescription:
      'You are running {currentVersion}. Review the changes, then approve deployment in GitHub Actions.',
    viewChanges: 'View changes',
    upgradeOnline: 'Upgrade online',
    dismissUpdate: 'Dismiss update notice',
  },
  'zh-CN': {
    updateAvailableTitle: 'Linketry {version} 已发布',
    updateAvailableDescription:
      '当前版本为 {currentVersion}，查看变更后可在 GitHub Actions 中确认部署。',
    viewChanges: '查看变更',
    upgradeOnline: '在线升级',
    dismissUpdate: '关闭更新提示',
  },
} as const;
