import { describe, expect, test } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, '../..');
const librarySrc = join(repoRoot, 'library/src');

function filesMatching(dir, predicate) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = join(dir, entry.name);
        if (entry.isDirectory()) return filesMatching(entryPath, predicate);
        return predicate(entry.name) ? [entryPath] : [];
    });
}

function stripCssComments(css) {
    return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('library CSS scoping', () => {
    test('source CSS files are CSS Modules', () => {
        const cssFiles = filesMatching(librarySrc, (fileName) => extname(fileName) === '.css');

        expect(cssFiles.length).toBeGreaterThan(0);
        expect(cssFiles.every((file) => file.endsWith('.module.css'))).toBe(true);
    });

    test('CSS Modules avoid root-level theme variables', () => {
        const cssFiles = filesMatching(librarySrc, (fileName) => fileName.endsWith('.module.css'));
        const rootSelectors = cssFiles.flatMap((file) => {
            const css = stripCssComments(readFileSync(file, 'utf-8'));
            return [...css.matchAll(/(^|})\s*:root\b/g)].map(() => file);
        });

        expect(rootSelectors).toEqual([]);
    });

    test('components expose stable public override roots', () => {
        const publicRootClasses = ['ws-skewt', 'ws-hodograph', 'ws-stats-table', 'ws-box-plot'];
        const source = filesMatching(librarySrc, (fileName) => fileName.endsWith('.jsx'))
            .map((file) => readFileSync(file, 'utf-8'))
            .join('\n');

        for (const className of publicRootClasses) {
            expect(source).toContain(className);
        }
    });
});