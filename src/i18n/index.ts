import deJson from './de.json';

type NestedString = { [key: string]: string | NestedString };

const SUPPORTED_LANGS: Record<string, NestedString> = {
  de: deJson as NestedString,
};

let currentTranslations: NestedString = SUPPORTED_LANGS['de'];

/**
 * Wechselt die aktive Sprache. Aktuell nur "de" unterstützt.
 * Unbekannte Sprachcodes fallen auf "de" zurück.
 */
export function loadLanguage(lang: string): void {
  const data = SUPPORTED_LANGS[lang];
  if (data !== undefined) {
    currentTranslations = data;
  } else {
    console.warn(`i18n: Sprache "${lang}" nicht unterstützt — Fallback auf "de"`);
    currentTranslations = SUPPORTED_LANGS['de'];
  }
}

/**
 * Löst einen dot-notation-Key aus der aktiven Sprachdatei auf.
 * Fehlt ein Key, wird der Key selbst zurückgegeben und ein Warn geloggt.
 */
export function t(key: string): string {
  const parts = key.split('.');
  let node: string | NestedString = currentTranslations;

  for (const part of parts) {
    if (typeof node !== 'object' || !(part in node)) {
      console.warn(`i18n: Fehlender Key "${key}"`);
      return key;
    }
    node = (node as NestedString)[part];
  }

  if (typeof node === 'string') {
    return node;
  }

  console.warn(`i18n: Key "${key}" ist kein String-Wert`);
  return key;
}
