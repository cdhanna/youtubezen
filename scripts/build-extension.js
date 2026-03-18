#!/usr/bin/env node
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const extDir = path.join(root, 'extension')
const outDir = path.join(root, 'webApp', 'public')
const outFile = path.join(outDir, 'youtubezen-extension.xpi')

fs.mkdirSync(outDir, { recursive: true })
execSync(`cd "${extDir}" && zip -r "${outFile}" .`, { stdio: 'inherit' })
if (!fs.existsSync(outFile)) {
  console.error('Extension build failed')
  process.exit(1)
}
