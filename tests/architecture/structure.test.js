/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

/**
 * Recursively lists .js files under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function listJsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listJsFiles(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

describe('Architecture & Module Structure Guardrails', () => {
  it('keeps every source file in public/js and netlify at or below 300 lines', () => {
    const files = [
      ...listJsFiles(path.join(ROOT, 'public/js')),
      ...listJsFiles(path.join(ROOT, 'netlify'))
    ];
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const lineCount = fs.readFileSync(file, 'utf8').split('\n').length;
      const rel = path.relative(ROOT, file);
      expect(lineCount, `${rel} has ${lineCount} lines (max 300)`).toBeLessThanOrEqual(300);
    }
  });

  it('forbids ui/** modules from importing domain/** or services/**', () => {
    const uiFiles = listJsFiles(path.join(ROOT, 'public/js/ui'));
    expect(uiFiles.length).toBeGreaterThan(0);

    const forbiddenRe = /from\s+['"][^'"]*(?:domain|services)\//;
    for (const file of uiFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const rel = path.relative(ROOT, file);
      expect(forbiddenRe.test(content), `${rel} must not import domain/ or services/`).toBe(false);
    }
  });
});
