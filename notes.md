npx expo prebuild --clean
cd android && ./gradlew assembleRelease
cd ../ && adb uninstall com.anonymous.elsewerapp && adb install android/app/build/outputs/apk/release/app-release.apk

adb install android/app/build/outputs/apk/release/app-release.apk

adb logcat -c && adb logcat | grep ReactNativeJS