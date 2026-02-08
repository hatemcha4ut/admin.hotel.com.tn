import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// Plugin to generate version.json before build
function versionPlugin() {
  return {
    name: 'version-plugin',
    buildStart() {
      try {
        // Get git SHA (short version)
        const sha = execSync('git rev-parse HEAD').toString().trim()
        
        // Generate version.json
        const versionInfo = {
          sha,
          builtAt: new Date().toISOString(),
        }
        
        // Write to public directory so it gets copied to dist during build
        const publicDir = path.resolve(__dirname, 'public')
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true })
        }
        
        fs.writeFileSync(
          path.join(publicDir, 'version.json'),
          JSON.stringify(versionInfo, null, 2)
        )
        
        console.log('✓ Generated version.json:', versionInfo)
      } catch (err) {
        console.warn('⚠ Could not generate version.json:', err instanceof Error ? err.message : err)
        // Create a fallback version.json
        const fallbackVersion = {
          sha: 'unknown',
          builtAt: new Date().toISOString(),
        }
        const publicDir = path.resolve(__dirname, 'public')
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true })
        }
        fs.writeFileSync(
          path.join(publicDir, 'version.json'),
          JSON.stringify(fallbackVersion, null, 2)
        )
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionPlugin()],
  base: '/',
})
