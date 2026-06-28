import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.myniqx.woorden',
  appName: 'Woorden',
  webDir: 'dist',
  server: {
    url: 'https://woorden.vercel.app',
    cleartext: false,
  },
};

export default config;
