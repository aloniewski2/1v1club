import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.club1v1.app',
  appName: '1v1 Club',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 400,
      backgroundColor: '#0c0d12',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      // Default theme is dark ("Voltage"), so status bar content starts light
      // (white icons on a dark background); NativeStatusBar flips this live
      // when the user switches to the light ("Split") theme.
      style: 'LIGHT',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
    },
  },
}

export default config
