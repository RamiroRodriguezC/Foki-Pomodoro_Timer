const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Desactiva package exports para evitar que Metro resuelva versiones ESM
// de dependencias (como zustand v5) que usan `import.meta` y no son
// transformadas dentro de node_modules para web.
config.resolver.unstable_enablePackageExports = false

module.exports = config
