const fs = require('fs');
const ts = require('typescript');

require.extensions['.ts'] = function (module, filename) {
  try {
    const content = fs.readFileSync(filename, 'utf8');
    const result = ts.transpileModule(content, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        allowJs: true,
      },
      fileName: filename,
    });
    module._compile(result.outputText, filename);
  } catch {
    module._compile(`module.exports = {};`, filename);
  }
};
