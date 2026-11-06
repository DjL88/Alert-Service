#!/usr/bin/env python3
"""Store Alerts audio receiver for a Raspberry Pi with ALSA (aplay). No Python packages required."""
import json
import math
import os
import subprocess
import tempfile
import time
import urllib.request
import wave

BASE = os.environ["ALERTS_URL"].rstrip("/")
TOKEN = os.environ["ALERTS_TOKEN"]
STORE = os.environ["ALERTS_LOCATION_ID"]
INTERVAL = max(2, int(os.environ.get("ALERTS_POLL_SECONDS", "3")))

def state():
    request = urllib.request.Request(BASE + "/api/console", headers={"Authorization": "Bearer " + TOKEN, "Cache-Control": "no-store"})
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.load(response)["state"]

def sound():
    rate = 22050
    with tempfile.NamedTemporaryFile(suffix=".wav") as file:
        with wave.open(file.name, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(rate)
            samples = bytearray()
            for frequency in (740, 980):
                for n in range(int(rate * .23)):
                    envelope = min(1.0, n / (rate * .015)) * min(1.0, (rate * .23 - n) / (rate * .06))
                    sample = int(7000 * envelope * math.sin(2 * math.pi * frequency * n / rate))
                    samples.extend(sample.to_bytes(2, "little", signed=True))
            wav.writeframes(samples)
        subprocess.run(["aplay", "-q", file.name], check=True, timeout=8)

def active(alert):
    return (alert.get("provider") == "screen" and alert.get("status") == "screen_available"
            and alert.get("locationId") == STORE
            and alert.get("expiresAt", "") > time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()))

def main():
    print("Connecting to Store Alerts; existing alerts will not be replayed.", flush=True)
    first = state()
    if not any(m.get("locationId") == STORE and m.get("state") == "active" and m.get("provider") == "screen" for m in first.get("mappings", [])):
        raise SystemExit("Store not registered as an active screen destination for this tenant")
    seen = {a["id"] for a in first.get("alerts", [])}
    print("Receiver ready for store", STORE, flush=True)
    while True:
        try:
            alerts = [a for a in state().get("alerts", []) if active(a)]
            fresh = [a for a in alerts if a["id"] not in seen]
            seen.update(a["id"] for a in alerts)
            if fresh:
                sound()
                print("Played", len(fresh), "new alert(s)", flush=True)
        except Exception as error:
            print("Receiver error:", error, flush=True)
        time.sleep(INTERVAL)

if __name__ == "__main__":
    main()
