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
2026-10-25: 38 tests passed, including real HTTP activation recovery, errors, bounded
token timeout, both delivery rows and refresh-status POST followed by GET. The sole
rideguard member served traffic; none stayed silent. Status-only operations did not
add activation/stop requests. Existing permission/cancellation regressions passed.
<!-- end:observations -->
