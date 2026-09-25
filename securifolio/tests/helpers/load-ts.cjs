const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
module.exports = function loadTs(filename, dependencies = {}) {
  const absolute = path.resolve(filename)
  const loaded = new Module(absolute, module)
  loaded.filename = absolute
  loaded.paths = Module._nodeModulePaths(path.dirname(absolute))
  const originalRequire = loaded.require.bind(loaded)
  loaded.require = id => Object.hasOwn(dependencies, id) ? dependencies[id] : originalRequire(id)
  loaded._compile(ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true}
  }).outputText, absolute)
  return loaded.exports
}
