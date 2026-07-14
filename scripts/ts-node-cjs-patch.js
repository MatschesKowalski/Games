// Node.js v22 wrapModuleLoad bypasses require.extensions for .ts files.
// This patch restores CJS loading via Module._load for ts-node compatibility.
const Module = require('module');
const orig = Module.runMain;
Module.runMain = function () {
  const main = process.argv[1];
  if (main && (main.endsWith('.ts') || main.endsWith('.tsx'))) {
    return Module._load(main, null, true);
  }
  return orig.apply(this, arguments);
};
