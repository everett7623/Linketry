// Eagerly bundles every locale; import only from tests, never from application code.
import { englishMessages } from './messages.ts';
import { zhCNMessages } from './zh-CN/index.ts';

export type { Locale } from './messages.ts';

export const messages = {
  en: englishMessages,
  'zh-CN': zhCNMessages,
} as const;
