import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finnote.app',
  appName: 'FinNote',
  webDir: 'dist',
  server: {
    // In development, use live-reload from Vite dev server
    // Uncomment the line below for local development:
    // url: 'http://YOUR_LOCAL_IP:3000',

    // In production, the app loads from the bundled dist/ folder
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    // Use WKWebView (default, modern)
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    // Status bar
    backgroundColor: '#000000',
    // Scroll behavior
    scrollEnabled: true,
  },
  plugins: {
    // Push Notifications (already configured as PWA, Capacitor can enhance)
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    // Status Bar
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
    },
    // Splash Screen
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
    },
  },
};

export default config;
