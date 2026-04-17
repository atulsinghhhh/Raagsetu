# Raagsetu Architecture Ovenview

## Problem Before Changes ❌
The application had multiple runtime issues:
- **Cannot access 'Platform' before initialization**: Circular dependency in Metro.
- **Expo Router ContextNavigator errors**: Redirection before router mount.
- **Blank screen during web hydration**: SSR mismatch and hydration crashes.
- **YouTube audio extraction failing**: Server-side IP blocking by YouTube.
- **CORS failures**: Browser security restrictions on direct web API calls.

## Key Architecture Changes Implemented ✅

### 1. Fixed Platform Initialization
Switched from static imports to dynamic `require("youtubei.js/web.bundle")` inside lazy-loader functions. This bypassed the Metro initialization cycle and stabilized the boot process.

### 2. Dynamic Library Loading
Instead of loading heavy libraries like `youtubei.js` at startup, they are now loaded on-demand. This prevents SSR crashes and ensures the navigation lifecycle is not blocked.

### 3. Singleton Innertube Session
Implemented a lazy-initialized singleton for the Innertube instance. This prevents memory leaks from multiple sessions and improves search performance.

### 4. Safe Navigation Lifecycle
Moved redirection logic from the root `_layout.tsx` to the `index.tsx` route. This ensures that `router.replace` is only called after the Navigator context is fully available.

### 5. Client-Side Audio Extraction
Bypassed backend server blocking by performing audio extraction directly on the user's device. 
- **Mobile**: Works natively (no CORS).
- **Web**: Restricted by CORS (standard browser security).

### 6. Adaptive Audio Streaming
Implemented bitrate sorting to ensure the player always selects the highest quality available audio stream before playback.

### 7. SSR-Safe Guards
Added `typeof window === "undefined"` checks across `supabase` and `audioManager` to ensure the app remains stable during Expo's static web generation.

## Results 🚀
- **Reliable Boot**: Zero initialization crashes on Web or Mobile.
- **Mobile Streaming**: Successfully fetches and plays YouTube audio without a backend proxy.
- **High Performance**: Singleton sessions and adaptive bitrate provide a premium user experience.
