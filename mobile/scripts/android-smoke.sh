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

collect() {
  log "Diagnostics"
  adb exec-out screencap -p >"$ARTIFACTS/screen.png" 2>/dev/null || true
  adb shell uiautomator dump /sdcard/window.xml >/dev/null 2>&1 || true
  adb shell cat /sdcard/window.xml >"$ARTIFACTS/ui.xml" 2>/dev/null || true
  adb shell dumpsys activity activities >"$ARTIFACTS/activities.txt" 2>/dev/null || true
  adb logcat -d -v threadtime >"$ARTIFACTS/logcat.txt" 2>/dev/null || true
  grep -nE 'FATAL EXCEPTION|Unable to load script|Invariant Violation' "$ARTIFACTS/logcat.txt" | tail -n 20 || true
  grep -o 'text="[^"]*"' "$ARTIFACTS/ui.xml" | head -n 30 || true
}

trap 'collect' EXIT

log "Device"
adb devices -l
adb wait-for-device
for _ in $(seq 1 120); do
  [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] && break
  sleep 2
done

log "Install $APK"
adb install -r -t "$APK"

log "Launch $ACTIVITY"
adb logcat -c
adb shell am start -W -n "$ACTIVITY"

log "Wait for UI: '$EXPECTED_TEXT'"
found=0
for _ in $(seq 1 60); do
  adb shell uiautomator dump /sdcard/window.xml >/dev/null 2>&1 || true
  if adb shell cat /sdcard/window.xml 2>/dev/null | grep -q "$EXPECTED_TEXT"; then
    found=1
    break
  fi
  sleep 2
done

log "Process / activity"
pid="$(adb shell pidof "$PKG" 2>/dev/null | tr -d '\r' || true)"
echo "pid=$pid"
adb shell dumpsys activity activities | grep -m3 -E 'mResumedActivity|topResumedActivity' || true

fail() { echo "FAIL: $*" >&2; exit 1; }

[ -n "$pid" ] || fail "app process is not running"
[ "$found" = "1" ] || fail "login screen did not render within 120s"

if adb logcat -d | grep -qE 'FATAL EXCEPTION|Unable to load script|Invariant Violation'; then
  fail "runtime error found in logcat"
fi

echo "OK: $PKG launched and rendered '$EXPECTED_TEXT'"
