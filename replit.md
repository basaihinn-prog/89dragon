# Jade Royale - Casino Gaming App (Mobile + Web)

**Version:** 3.0.0

## Overview

Jade Royale is both a React Native mobile app (Expo) and a full React web app. The web app is the primary running app served by Vite at port 5000. It replicates all features of the mobile app with the same neon/glassmorphic design system.

### Web App (Primary - runs in browser)
Located in `web/` directory. Built with React 18 + Vite + TypeScript + React Router v6. Served at port 5000.

**Start command:** `cd web && npm run dev`

### Mobile App (Expo)
The original React Native app remains in the root directory for EAS builds.

Jade Royale is a React Native mobile application for a casino gaming platform. Built with Expo, it provides a landscape-first gaming experience with WebView-based game integration, real-time balance tracking, and JWT authentication against an existing Laravel casino backend.

The app features a neon-themed glassmorphic UI, persistent sidebar navigation, game favorites, transaction history, and user profile management. Games are categorized (Hot, Favorites, Slots, Arcade) and launched via WebSocket connections with dynamic orientation support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React Native 0.81.5 with Expo SDK 54

**UI Paradigm:** Landscape-first with custom hybrid navigation
- Persistent sidebar for category filtering (left-side vertical navigation)
- No tab bar - all navigation via sidebar and modals
- Stack-based navigation for secondary screens (Profile, Settings, Game Player)
- Orientation lock: Landscape default, portrait for slot games

**State Management:** React Context API
- `AuthContext` - JWT authentication, user session, balance management
- `GamesContext` - Game catalog, categories, favorites, filtering, **local caching**
- `AudioContext` - Background music control, volume settings
- `SpinWheelContext` - Backend-driven spin wheel bonus (strictly API-driven)
- `DailyBonusContext` - Daily login bonus management

**Offline Support:**
- Games list cached locally via AsyncStorage after successful API load
- When API fails (500 error, network issues), cached games are displayed
- Visual banner indicates "Showing saved games" when using cache
- Pull-to-refresh attempts to reload from API

**PWA Support (iPhone/iOS):**
- Full Progressive Web App configuration for iOS Safari
- Custom manifest.json with app icons and standalone display mode
- iOS-specific meta tags (apple-mobile-web-app-capable, status bar style)
- Apple touch icons for home screen installation
- IOSInstallPrompt component guides users through "Add to Home Screen" flow
- Prompt appears after 3 seconds on iOS Safari (not in standalone mode)
- Remembers dismissal for 7 days before showing again

**UI Components:**
- Custom neon-themed components (NeonButton, NeonInput)
- Glassmorphic cards using expo-blur (BlurView with dark tint)
- Animated gradient backgrounds via react-native-reanimated
- Reusable screen wrappers with safe area handling

**Animation:** react-native-reanimated v4.1.1
- Spring-based interactions (press scaling, button feedback)
- Shared value animations for balance refresh, category selection
- Timed transitions for splash screen fade-out

**Navigation Structure:**
1. Splash Screen (first launch only) - GIF-based brand intro
2. Login Screen - JWT authentication flow
3. Main Gallery - Sidebar + game carousels by category
4. Game Screen - WebView launcher with orientation management
5. Profile/Settings - Modal overlays in landscape

### Backend Architecture

**API Integration:** RESTful Laravel backend at `bxbet.asia`

**Authentication:**
- JWT token-based (stored via expo-secure-store on native, AsyncStorage on web)
- Login endpoint: `POST /api/login` returns JWT token
- Token included in all requests via `Authorization: Bearer {token}` header
- API key authentication via `X-API-Key` header for all requests

**Game Launching:**
- WebView loads `https://bxbet.asia/launcher/{gameName}/{token}`
- Games use WebSocket connections (wss://bxbet.asia:22150-22190)
- Three WebSocket servers: Slots (22150), Arcade (22180), Server (22190)
- Orientation determined by game type: slots=portrait, arcade=landscape

**API Endpoints Used:**
- `POST /api/login` - User authentication (returns JWT token)
- `GET /api/mobile/profile` - User profile with balance
- `GET /api/mobile/balance/refresh` - Real-time balance updates
- `GET /api/mobile/games` - Game catalog (currently has server error)
- `GET /api/mobile/games/categories` - Game categories (Fishing, Slots, Table Games)
- `GET /api/mobile/games/{name}/launch` - Launch game session
- `GET /api/mobile/transactions` - Transaction history
- `GET /api/mobile/jackpots` - Jackpot wins
- `GET /api/mobile/daily-rewards/status` - Daily reward status
- `POST /api/mobile/daily-rewards/claim` - Claim daily reward
- `GET /api/mobile/refunds/available` - Available refunds
- `POST /api/mobile/refunds/claim` - Claim refunds
- `POST /api/mobile/password/change` - Change password
- `GET /api/mobile/sessions` - Active sessions
- `DELETE /api/mobile/sessions/{id}` - Invalidate session
- `GET /api/mobile/wheel-fortune/config` - Wheel of Fortune configuration and available spins
- `POST /api/mobile/wheel-fortune/spin` - Spin the wheel and get prize
- `GET /api/mobile/favorites` - Get user's favorite games
- `POST /api/mobile/favorites/add/{game}` - Add game to favorites
- `DELETE /api/mobile/favorites/remove/{game}` - Remove game from favorites
- `GET /api/mobile/game-stats` - Game statistics for wagering progress
- `GET /api/mobile/game-activity` - User's game activity summary
- `POST /api/mobile/voucher/activate` - PIN code deposit (only deposit method)

**Referral API Endpoints (Pending Backend Implementation):**
- `GET /api/mobile/referrals/profile` - Get referral code, stats, and recent referrals
- `POST /api/mobile/referrals/claim` - Claim pending referral rewards

**Data Models:**
- User: id, username, email, balance, phone, avatar
- Game: id, name, title, gamebank (category), device, image, orientation
- Category: id, title, position
- Transaction: user operations history
- Jackpot: big win records

**Cashout Progress Tracking:**
- Uses real API data from `/api/mobile/transactions` (for deposits) and `/api/mobile/game-stats` (for wagering)
- 3x playthrough requirement: must wager 3x deposited amount before cashout is allowed
- Zero-deposit users (agent credits, promo winnings) are automatically eligible with no playthrough requirement
- $500 daily cashout limit
- Error handling with retry mechanism when API fails
- PayPal email management separated from cashout eligibility (users can save payout details anytime)
- Visual states: Loading, Error (with retry), No Requirement (eligible), In Progress (with progress bar), Eligible

### Data Storage Solutions

**Secure Storage (Native):** expo-secure-store
- JWT tokens
- User credentials (if "Remember Me" enabled)

**Async Storage (Web fallback):** @react-native-async-storage/async-storage
- Favorite games list (local cache)
- User preferences (music enabled, volume)
- Splash screen view status

**No Direct Database Access:** App communicates exclusively via REST API. Backend uses MySQL database `sql_cashout_realconnect_online` with `w_` table prefix (76 tables total), but mobile app never connects directly.

### Authentication and Authorization

**Flow:**
1. User enters username/password on LoginScreen
2. POST to `/api/login` with credentials
3. Backend validates against `w_users` table, returns JWT token
4. Token stored securely (SecureStore/AsyncStorage)
5. All subsequent API calls include token in Authorization header
6. Token refresh handled via `/api/mobile/balance/refresh` periodic calls
7. Logout clears stored token and navigates to login

**Session Management:**
- Tokens persist across app restarts
- `hasSeenSplash` flag prevents splash replay
- Session invalidation via `DELETE /api/mobile/sessions/{id}`

**Authorization:**
- All protected endpoints require valid JWT
- API key required for all requests (development key: `j5VkzT5A8ikNICicxkTENKC4RAjFZPra0loFFVwYyOQcAyVRxCiRJQzjhE9XPxTl`)
- Balance operations restricted to authenticated user's account

## External Dependencies

### Third-Party Services

**Backend API:** bxbet.asia (Laravel-based casino platform)
- RESTful API for all data operations
- WebSocket servers for real-time game communication
- Image CDN for game thumbnails

**Authentication Provider:** JWT tokens issued by Laravel backend
- No third-party auth (no Firebase, Auth0, etc.)
- Custom implementation via existing casino platform

### External APIs

**Game Launcher:** WebView-based game integration
- Games hosted on backend, loaded via `launcher/{game}/{token}` endpoint
- WebSocket connections for game state synchronization
- Three separate WebSocket servers based on game type

**Image Assets:** Game images retrieved via helper function
- `getGameImageUrl(game)` constructs image URLs from game objects
- Fallback handling for missing images

### Third-Party Libraries

**Expo Modules:**
- expo-av: Background music playback
- expo-blur: Glassmorphic UI effects
- expo-screen-orientation: Landscape/portrait locking
- expo-secure-store: Encrypted token storage
- expo-image: Optimized image loading with caching
- expo-linear-gradient: Neon gradient backgrounds
- expo-haptics: Touch feedback
- expo-web-browser: External link handling (forgot password, terms)

**React Navigation:**
- @react-navigation/native: Core navigation
- @react-navigation/native-stack: Stack navigator

**React Native Community:**
- @react-native-async-storage/async-storage: Web storage fallback
- @react-native-community/slider: Volume control
- react-native-webview: Game embedding
- react-native-reanimated: High-performance animations
- react-native-gesture-handler: Touch interactions
- react-native-keyboard-controller: Keyboard management

**UI Components:**
- @expo/vector-icons (Feather icon set): Navigation icons, UI elements
- No external UI library (custom components)

### Database Schema (Accessed via API Only)

**Database:** MySQL - `sql_cashout_realconnect_online`

**Key Tables:**
- `w_users` - User accounts, balances
- `w_games` - Game catalog
- `w_categories` - Game categories
- `w_game_log` - Game play history
- `w_credits` - User transactions
- `w_game_bank` - Slot game banking/jackpots
- `w_sessions` - Active user sessions

**Access Pattern:** Mobile app NEVER connects directly to database. All data access via REST API endpoints with JWT authentication.