import { isPublicDemoBuild } from '../utils/demoMode';

export const IS_PUBLIC_DEMO = isPublicDemoBuild(import.meta.env.VITE_LINKETRY_DEMO_MODE);
export const DEMO_ACCESS_CODE =
  import.meta.env.VITE_LINKETRY_DEMO_ACCESS_CODE?.trim() || 'LinketryDemo';
