# Audio delivery

Store Alerts produces order events. The destination decides how to notify colleagues.

- **VoCoVo:** Provider-managed voice. We do not synthesize or upload speech. Delivery remains blocked until the VoCoVo Notification API contract, credentials and routing are verified.
- **Store screen / KDS:** Two simple browser-generated tones. No speech engine, tenant voice packs or external audio downloads.
- **Analogue headset systems (e.g. Quail):** A local device outputs audio to a compatible external input. Confirm connector, signal level, electrical isolation and permissions with the headset vendor first.

## Browser / Android tablet prototype

Open `/receiver.html` on a device connected to the desired audio output. Enter the tenant's server-configured access token, press **Connect and enable sound**, then choose an active screen destination. Test the sound before connecting hardware.

A browser cannot guarantee audio when the screen sleeps, the page is backgrounded, the OS suspends the browser, or the network disconnects. Keep the screen awake for a pilot. A dedicated Android app with a foreground service, device provisioning and persistent event connection is the production path.

## Raspberry Pi prototype

Requires Raspberry Pi OS, Python 3, ALSA `aplay`, network access and a supported audio interface. Example:

```sh
export ALERTS_URL=https://your-service.example
export ALERTS_TOKEN='tenant-specific-secret'
export ALERTS_LOCATION_ID='registered-store-id'
python3 receiver/pi_receiver.py
```

The receiver uses HTTPS, polls every three seconds, ignores existing alerts at startup, and plays one two-tone sound for a batch of new, unexpired alerts. Configure a service supervisor for restart and log capture. Never put credentials in the repo, process arguments or a publicly served file. Provision each store with a narrowly scoped device credential before production; the current admin token is **pilot-only** and grants more access than a receiver needs.

## Production gaps

1. Add server-issued **per-device credentials** bound to tenant, location and destination, rather than reusing admin tokens.
2. Add an authenticated, store-scoped event stream / long poll with monotonic sequence and acknowledgement; current three-second polling of `/api/console` is only a prototype and downloads the tenant's full state.
3. Add heartbeat, offline status, replay policy, delivery telemetry and alert prioritisation.
4. Confirm vendor electrical compatibility and whether VoCoVo accepts notification text or predefined identifiers.
5. Use an Android foreground-service application for unattended operation. A webpage alone is not a reliable headless Android receiver.

No orders are accepted, picked or modified by either receiver.
