const ANONYMOUS_URLS_STORAGE_KEY = 'youRL_anonymous_short_ids';

function readStoredShortIds(): string[] {
  try {
    const raw = localStorage.getItem(ANONYMOUS_URLS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0);
  } catch {
    return [];
  }
}

function writeStoredShortIds(shortIds: string[]): void {
  if (shortIds.length === 0) {
    localStorage.removeItem(ANONYMOUS_URLS_STORAGE_KEY);
    return;
  }

  localStorage.setItem(ANONYMOUS_URLS_STORAGE_KEY, JSON.stringify(shortIds));
}

export class AnonymousUrlService {
  static add(shortId: string): void {
    const existing = readStoredShortIds();
    if (existing.includes(shortId)) {
      return;
    }
    writeStoredShortIds([...existing, shortId]);
  }

  static list(): string[] {
    return readStoredShortIds();
  }

  static clear(): void {
    localStorage.removeItem(ANONYMOUS_URLS_STORAGE_KEY);
  }
}
