#!/usr/bin/env bash
set -e
npm install expo
npx expo install react react-native \
  @expo/vector-icons @react-native-async-storage/async-storage \
  @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs \
  react-native-screens react-native-safe-area-context \
  expo-status-bar expo-linear-gradient expo-notifications expo-speech expo-audio expo-video \
  expo-file-system expo-sharing expo-localization expo-image-picker expo-image-manipulator \
  expo-updates expo-apple-authentication expo-crypto expo-tracking-transparency \
  react-native-view-shot firebase react-native-purchases \
  @react-native-google-signin/google-signin react-native-fbsdk-next react-native-google-mobile-ads
npm install --save-dev @expo/ngrok
npx expo install --fix
