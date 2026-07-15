import type { DeploymentCapabilities } from '@linketry/shared';

export function enabledAdvancedCapabilityCount(capabilities: DeploymentCapabilities): number {
  return [
    capabilities.advanced.r2Backups,
    capabilities.advanced.visitQueue,
    capabilities.advanced.multipleDomains,
  ].filter(Boolean).length;
}
