import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// happy-dom replaces the global URL, so fixture paths resolve from the
// project root (vitest's cwd) instead of import.meta.url.
export function loadFixture(name: string): Document {
  const path = join(process.cwd(), 'tests', 'dom', 'fixtures', `${name}.html`);
  const html = readFileSync(path, 'utf-8');
  return new DOMParser().parseFromString(html, 'text/html');
}
