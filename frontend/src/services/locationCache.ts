import * as Location from 'expo-location';

interface CachedLocation {
    latitude: number;
    longitude: number;
    timestamp: number;
}

let cachedLocation: CachedLocation | null = null;
let pendingRequest: Promise<CachedLocation | null> | null = null;

const CACHE_DURATION = 30_000; // 30 seconds — fresh enough, saves GPS calls

/**
 * Returns the user's location from cache if fresh, else requests GPS.
 * Multiple simultaneous callers share one GPS request (deduped).
 */
export async function getCachedLocation(): Promise<CachedLocation | null> {
    // Return cache if still fresh
    if (cachedLocation && Date.now() - cachedLocation.timestamp < CACHE_DURATION) {
        return cachedLocation;
    }

    // If a request is already in-flight, piggyback on it
    if (pendingRequest) return pendingRequest;

    pendingRequest = (async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return null;

            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced, // faster than High
            });

            cachedLocation = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                timestamp: Date.now(),
            };
            return cachedLocation;
        } catch {
            return cachedLocation; // return stale if GPS fails
        } finally {
            pendingRequest = null;
        }
    })();

    return pendingRequest;
}

/** Force-clear the cache (e.g. when user moves significantly) */
export function invalidateLocationCache() {
    cachedLocation = null;
}
