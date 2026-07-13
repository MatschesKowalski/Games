import { describe, it, expect, vi, beforeEach } from 'vitest';
import { t, loadLanguage } from './index';

describe('i18n', () => {
  beforeEach(() => {
    loadLanguage('de');
  });

  it('t("app.title") liefert den deutschen Titel aus de.json', () => {
    expect(t('app.title')).toBe('Aufbau-Spiel');
  });

  it('t("nicht.vorhanden") gibt den Key selbst zurück ohne Crash', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = t('nicht.vorhanden');
    expect(result).toBe('nicht.vorhanden');
    warn.mockRestore();
  });

  it('verschachtelter Key ui.resources.wood wird korrekt aufgelöst', () => {
    expect(t('ui.resources.wood')).toBe('Holz');
  });

  it('fehlender Key löst console.warn aus', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    t('nicht.vorhanden');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nicht.vorhanden'));
    warn.mockRestore();
  });

  it('ui.loading liefert Ladetext', () => {
    expect(t('ui.loading')).toBe('Wird geladen...');
  });

  it('ui.resources.stone liefert Stein', () => {
    expect(t('ui.resources.stone')).toBe('Stein');
  });

  it('ui.resources.food liefert Nahrung', () => {
    expect(t('ui.resources.food')).toBe('Nahrung');
  });

  it('ui.resources.gold liefert Gold', () => {
    expect(t('ui.resources.gold')).toBe('Gold');
  });

  it('errors.save.invalid liefert die Fehlermeldung', () => {
    expect(t('errors.save.invalid')).toBe('Ungültige Speicherdatei. Bitte prüfe die Datei und versuche es erneut.');
  });

  it('loadLanguage mit unbekannter Sprache fällt auf de zurück', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    loadLanguage('fr');
    expect(t('app.title')).toBe('Aufbau-Spiel');
    warn.mockRestore();
  });

  it('loadLanguage("de") bleibt funktionsfähig', () => {
    loadLanguage('de');
    expect(t('ui.resources.wood')).toBe('Holz');
  });
});
