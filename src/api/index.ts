// Picks the live or fake implementation from VITE_API_MODE. Screens import `api` from here and never
// know which one they have.
import { createFakeApi } from './fake';
import { createLiveApi } from './live';
import type { Api } from './ports';

export const apiMode: 'live' | 'fake' = import.meta.env.VITE_API_MODE === 'fake' ? 'fake' : 'live';

export const api: Api = apiMode === 'fake' ? createFakeApi() : createLiveApi();

export type { Api } from './ports';
