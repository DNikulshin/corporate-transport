#!/usr/bin/env bash
# Install the release APK on a running emulator and verify the React Native UI renders.
# Run in CI from the repo root (android-emulator-runner) or locally with a booted device.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.." # -> mobile/

PKG="${PKG:-com.dnikulshun.mobile}"
ACTIVITY="$PKG/.MainActivity"
EXPECTED_TEXT="${EXPECTED_TEXT:-Корпоративный транспорт}"
ARTIFACTS="${ARTIFACTS:-$PWD/build/emulator-artifacts}"
APK="${APK:-$(ls -1 android/app/build/outputs/apk/release/*.apk | head -n1)}"

mkdir -p "$ARTIFACTS"

log() { printf '\n=== %s ===\n' "$*"; }

ui_xml() { # current window hierarchy, empty on failure
  adb shell uiautomator dump /sdcard/window.xml >/dev/null 2>&1 || true
  adb shell cat /sdcard/window.xml 2>/dev/null || true
}

collect() {
  log "Diagnostics"
  adb exec-out screencap -p >"$ARTIFACTS/screen.png" 2>/dev/null || true
  ui_xml >"$ARTIFACTS/ui.xml"
  adb shell dumpsys activity activities >"$ARTIFACTS/activities.txt" 2>/dev/null || true
  adb logcat -d -v threadtime >"$ARTIFACTS/logcat.txt" 2>/dev/null || true
  grep -nE 'FATAL EXCEPTION|Unable to load script|Invariant Violation' "$ARTIFACTS/logcat.txt" | tail -n 20 || true
  grep -o 'text="[^"]*"' "$ARTIFACTS/ui.xml" | head -n 30 || true
}

# Always keep artifacts from the run, successful or not.
trap 'status=$?; collect || true; exit $status' EXIT

log "Device"
adb devices -l
adb wait-for-device
for _ in $(seq 1 180); do
  [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] && break
  sleep 2
done
[ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] || {
  echo "FAIL: emulator did not finish booting" >&2
  exit 1
}

# A freshly booted emulator is still busy; hide crash/ANR dialogs and wake the screen
# so they cannot cover the app window we are about to assert on.
adb shell settings put global hide_error_dialogs 1 || true
adb shell input keyevent KEYCODE_WAKEUP || true
adb shell wm dismiss-keyguard || true

log "Install $APK"
adb install -r -t "$APK"

log "Launch $ACTIVITY"
adb logcat -c

found=0
for attempt in 1 2 3; do
  log "Attempt $attempt"
  adb shell am start -n "$ACTIVITY" >/dev/null 2>&1 || true
  for _ in $(seq 1 40); do # up to 120s per attempt
    xml="$(ui_xml)"
    if printf '%s' "$xml" | grep -q "$EXPECTED_TEXT"; then
      found=1
      break 2
    fi
    if printf '%s' "$xml" | grep -qE "isn't responding|is not responding|Не отвечает"; then
      adb shell input keyevent KEYCODE_BACK >/dev/null 2>&1 || true
    fi
    sleep 3
  done
done

log "Process / activity"
pid="$(adb shell pidof "$PKG" 2>/dev/null | tr -d '\r' || true)"
echo "pid=$pid"
adb shell dumpsys activity activities | grep -m3 -E 'mResumedActivity|topResumedActivity' || true

fail() { echo "FAIL: $*" >&2; exit 1; }

[ -n "$pid" ] || fail "app process is not running"
[ "$found" = "1" ] || fail "login screen did not render within the retry budget"

if adb logcat -d | grep -qE 'FATAL EXCEPTION|Unable to load script|Invariant Violation'; then
  fail "runtime error found in logcat"
fi

echo "OK: $PKG launched and rendered '$EXPECTED_TEXT'"
