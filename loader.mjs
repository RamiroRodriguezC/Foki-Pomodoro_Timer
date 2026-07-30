import ts from 'typescript';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function load(url, context, defaultLoad) {
  if (url.endsWith('.ts') || url.endsWith('.tsx') || url.endsWith('.d.ts')) {
    try {
      const filePath = fileURLToPath(url);
      const content = fs.readFileSync(filePath, 'utf8');
      const result = ts.transpileModule(content, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
        fileName: filePath,
      });
      return {
        format: 'module',
        shortCircuit: true,
        source: result.outputText,
      };
    } catch {
      // If reading/transpiling fails, fallback
    }
  }
  return defaultLoad(url, context, defaultLoad);
}
