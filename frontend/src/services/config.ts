const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export const BACKEND_ORIGIN = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || 'https://team3-shortkings-dot-rice-comp-539-spring-2022.uk.r.appspot.com'
);

export const API_BASE = `${BACKEND_ORIGIN}/api`;
export const USER_API_BASE = `${API_BASE}/users`;
