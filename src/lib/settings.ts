// Owner preferences kept in this browser's localStorage (single user, no settings table).

const KEYS = {
  prenom: "lc_prenom",
  signature: "lc_signature",
  region: "lc_region",
} as const;

export type SettingKey = keyof typeof KEYS;

export function getSetting(key: SettingKey): string {
  try {
    return window.localStorage.getItem(KEYS[key]) ?? "";
  } catch {
    return "";
  }
}

export function setSetting(key: SettingKey, value: string): void {
  try {
    window.localStorage.setItem(KEYS[key], value);
  } catch {
    // Storage unavailable (private mode): the value simply is not remembered
  }
}
