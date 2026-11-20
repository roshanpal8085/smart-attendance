# Android Native Configuration & Setup Guide

This document details the Android native configuration required for React Native 0.74 bare workflow for the Smart College Attendance System.

---

## 1. AndroidManifest.xml Permissions

Add the following permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Internet & Network -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Legacy Bluetooth Permissions (Android 11 / API <= 30) -->
    <uses-permission
        android:name="android.permission.BLUETOOTH"
        android:maxSdkVersion="30" />
    <uses-permission
        android:name="android.permission.BLUETOOTH_ADMIN"
        android:maxSdkVersion="30" />
    <uses-permission
        android:name="android.permission.ACCESS_FINE_LOCATION"
        android:maxSdkVersion="30" />
    <uses-permission
        android:name="android.permission.ACCESS_COARSE_LOCATION"
        android:maxSdkVersion="30" />

    <!-- Modern Bluetooth Permissions (Android 12+ / API >= 31) -->
    <!-- Required for BLE beacon and peripheral scanning (Student & Teacher) -->
    <uses-permission
        android:name="android.permission.BLUETOOTH_SCAN"
        android:usesPermissionFlags="neverForLocation" />

    <!-- Required for BLE connection verification -->
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

    <!-- Required for BLE Advertising (Teacher mode session broadcasting) -->
    <uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />

    <!-- Hardware Features -->
    <uses-feature
        android:name="android.hardware.bluetooth_le"
        android:required="true" />

    <!-- Biometric Authentication -->
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission
        android:name="android.permission.USE_FINGERPRINT"
        android:maxSdkVersion="28" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        <!-- Activity declarations -->
    </application>
</manifest>
```

> **Note on `neverForLocation`:** If your beacon deployment uses BLE beacons strictly for proximity verification without deriving physical GPS coordinates, `neverForLocation` satisfies Google Play store policies. If precise location resolution is needed on Android 12+, omit the `android:usesPermissionFlags="neverForLocation"` attribute and request runtime `ACCESS_FINE_LOCATION`.

---

## 2. Gradle Configuration (`android/build.gradle` and `android/app/build.gradle`)

In `android/build.gradle`:

```groovy
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 23
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "26.1.10909125"
        kotlinVersion = "1.9.22"
    }
}
```

In `android/app/build.gradle`:

```groovy
android {
    namespace "com.smartattendance"
    compileSdkVersion rootProject.ext.compileSdkVersion

    defaultConfig {
        applicationId "com.smartattendance"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
        multiDexEnabled true
    }
}
```

---

## 3. Library Specific Setup

### react-native-ble-plx
1. Add `react-native-ble-plx` repository configuration in `android/build.gradle`:
```groovy
allprojects {
    repositories {
        mavenCentral()
        google()
    }
}
```
2. Android 12 (API 31+) requires runtime permissions for `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT`. The app handles this via `react-native-permissions` inside `src/services/bleService.ts`.

### react-native-biometrics
1. Supported natively starting from `minSdkVersion 23`.
2. Uses AndroidX Biometric library (`androidx.biometric:biometric:1.2.0-alpha05` or higher).
3. In `android/app/src/main/res/values/styles.xml`, ensure your theme extends `Theme.AppCompat` or `Theme.MaterialComponents` to support BiometricPrompt dialogs.

### react-native-vector-icons
In `android/app/build.gradle`:
```groovy
apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")
```
This automatically bundles `Ionicons.ttf` and all other font assets into `android/app/src/main/assets/fonts/`.
