import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.linguapop.app',
  appName: 'LinguaPop',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
