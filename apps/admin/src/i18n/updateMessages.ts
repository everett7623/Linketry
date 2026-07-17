export const updateMessages = {
  en: {
    updateAvailableTitle: 'Linketry {version} is available',
    updateAvailableDescription:
      'You are running {currentVersion}. Review the changes, then approve deployment in GitHub Actions.',
    updateAvailableAutomaticDescription:
      'You are running {currentVersion}. Review the changes, then deploy the update here.',
    viewChanges: 'View changes',
    viewDeployment: 'View deployment',
    upgradeOnline: 'Upgrade online',
    upgradingOnline: 'Upgrading',
    checkingUpgrade: 'Checking upgrade',
    confirmUpgradeTitle: 'Confirm online upgrade',
    confirmUpgradeMessage:
      'Deploy Linketry {version} now? The protected backup, migration, target, and release gates must all pass.',
    confirmUpgrade: 'Confirm upgrade',
    upgradeStarting: 'Starting the protected deployment...',
    upgradeQueued: 'Deployment is queued in GitHub Actions...',
    upgradeRunning: 'Worker and Admin deployment is running...',
    upgradeFinalizing: 'Deployment succeeded. Verifying the runtime version...',
    upgradeSucceeded: 'Upgrade complete. Reloading the Admin...',
    upgradeFailed: 'Deployment ended with status: {conclusion}.',
    upgradeFailedGeneric: 'Online upgrade failed.',
    upgradeTimeout: 'Deployment did not publish the expected version in time.',
    dismissUpdate: 'Dismiss update notice',
  },
  'zh-CN': {
    updateAvailableTitle: 'Linketry {version} 已发布',
    updateAvailableDescription:
      '当前版本为 {currentVersion}，查看变更后可在 GitHub Actions 中确认部署。',
    updateAvailableAutomaticDescription:
      '当前版本为 {currentVersion}，查看变更后可直接在后台部署更新。',
    viewChanges: '查看变更',
    viewDeployment: '查看部署',
    upgradeOnline: '在线升级',
    upgradingOnline: '正在升级',
    checkingUpgrade: '检查升级能力',
    confirmUpgradeTitle: '确认在线升级',
    confirmUpgradeMessage:
      '现在部署 Linketry {version}？备份、迁移、目标和发布安全门禁必须全部通过。',
    confirmUpgrade: '确认升级',
    upgradeStarting: '正在启动受保护的部署...',
    upgradeQueued: '部署已进入 GitHub Actions 队列...',
    upgradeRunning: '正在部署 Worker 和 Admin...',
    upgradeFinalizing: '部署已成功，正在核对运行版本...',
    upgradeSucceeded: '升级完成，正在重新加载后台...',
    upgradeFailed: '部署结束状态：{conclusion}。',
    upgradeFailedGeneric: '在线升级失败。',
    upgradeTimeout: '未能在限定时间内发布预期版本。',
    dismissUpdate: '关闭更新提示',
  },
} as const;
