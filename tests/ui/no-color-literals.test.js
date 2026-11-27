import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_DIR = path.resolve(__dirname, '../../public/css');
const EXEMPT_FILES = new Set(['tokens.css', 'themes.css']);
const COLOR_LITERAL_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g;

describe('CSS Color Literal Policy', () => {
  it('forbids literal hex, rgb(), or hsl() colors outside tokens.css and themes.css', () => {
    const files = fs.readdirSync(CSS_DIR).filter((f) => f.endsWith('.css') && !EXEMPT_FILES.has(f));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = fs.readFileSync(path.join(CSS_DIR, file), 'utf8');
      const matches = content.match(COLOR_LITERAL_RE) || [];
      expect(matches, `Found disallowed color literals in ${file}: ${matches.join(', ')}`).toEqual(
        []
      );
    }
  });
});
