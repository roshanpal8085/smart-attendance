# iOS Native Configuration & Setup Guide

This document details the iOS native configuration required for React Native 0.74 bare workflow for the Smart College Attendance System.

---

## 1. Info.plist Keys

Add the following privacy usage descriptions to `ios/SmartAttendance/Info.plist`:

```xml
<dict>
    <!-- Bluetooth Permissions -->
    <!-- Required for background and foreground beacon scanning -->
    <key>NSBluetoothAlwaysUsageDescription</key>
    <string>Smart Attendance needs Bluetooth access to detect classroom beacons and verify student physical presence.</string>

    <!-- Required for Bluetooth peripheral mode (Teacher session advertising) -->
    <key>NSBluetoothPeripheralUsageDescription</key>
    <string>Smart Attendance needs Bluetooth peripheral access for teachers to broadcast attendance sessions to students.</string>

    <!-- Biometric Authentication -->
    <key>NSFaceIDUsageDescription</key>
    <string>Smart Attendance uses Face ID / Touch ID to securely authenticate and verify identity when marking attendance.</string>

    <!-- UI Background Modes (Optional, for persistent presence tracking) -->
    <key>UIBackgroundModes</key>
    <array>
        <string>bluetooth-central</string>
        <string>bluetooth-peripheral</string>
    </array>
</dict>
```

---

## 2. Podfile Configuration

In `ios/Podfile`:

```ruby
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

platform :ios, '13.4'
prepare_react_native_project!

target 'SmartAttendance' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    # Hermes is enabled by default in React Native 0.74
    :hermes_enabled => true
  )

  # Permissions configuration for react-native-permissions
  permissions_path = '../node_modules/react-native-permissions/ios'
  pod 'Permission-BluetoothPeripheral', :path => "#{permissions_path}/BluetoothPeripheral"
  pod 'Permission-FaceID', :path => "#{permissions_path}/FaceID"

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false
    )
  end
end
```

---

## 3. Entitlements & Capabilities

In Xcode:
1. Select the `SmartAttendance` project target.
2. Navigate to **Signing & Capabilities**.
3. If background BLE scanning is required, add the **Background Modes** capability:
   - Check **Uses Bluetooth LE accessories** (Central mode)
   - Check **Acts as a Bluetooth LE accessory** (Peripheral mode)
4. Keychain Sharing (optional): `react-native-keychain` operates securely using standard iOS Keychain Services API without requiring a shared app group unless cross-app sharing is needed.

---

## 4. Fonts / Vector Icons

Add `Ionicons.ttf` from `node_modules/react-native-vector-icons/Fonts/Ionicons.ttf` to the Xcode project:
1. Drag the file into `SmartAttendance` group.
2. Ensure "Copy items if needed" is selected and target membership includes `SmartAttendance`.
3. In `Info.plist`, ensure `UIAppFonts` contains:
```xml
<key>UIAppFonts</key>
<array>
    <string>Ionicons.ttf</string>
</array>
```
