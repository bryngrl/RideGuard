# SOS mobile simulation

Updated 2026-10-25. Backend fixture derived from RideGuard's saved SOS contract.

## Purpose
Run the real mobile HTTP client/store against controlled backend responses.
This does not run Node's service or simulate TextBee; see the backend provider simulation.

## Execution
1. `postman simulation run postman/simulations/sos-mobile.sim.yaml --port 4966 --output ndjson`
2. `$env:SOS_SIM_BASE_URL='http://127.0.0.1:4966/rideguard/v1'`
3. `node --test scripts/test-sos.cjs`; inspect member request events; Ctrl+C to stop.

## Assumptions
2026-10-25: Tests require loopback HTTP and reset fixture state. The `delivery` mode
adds both message rows and status-only jobs; control routes advance evidence.
It does not prove Android focus, native permissions, accessibility or real delivery.

## Observations
<!-- begin:observations -->
2026-10-26: Done clears local ended recovery regardless of delivered, failed, or
expired-unconfirmed results. Real HTTP checks reopen the trigger, start a fresh
SOS with a new request ID, and confirm Done itself adds no send or stop request.
Local regressions also fence late fetches and stop-persistence completion.
2026-10-25: 47 tests passed after moving entry discovery before navigation.
Real HTTP entry returned idle then active routes; fixture counts confirmed entry
added no activation or stop. The rideguard member logged both GET lookups.
Local tests also covered failed discovery, logout/background, an in-flight
lookup, and skipping the trigger's duplicate entry check while retaining resume checks.
2026-10-25: 38 tests passed, including real HTTP activation recovery, errors, bounded
token timeout, both delivery rows and refresh-status POST followed by GET. The sole
rideguard member served traffic; none stayed silent. Status-only operations did not
add activation/stop requests. Existing permission/cancellation regressions passed.
<!-- end:observations -->
