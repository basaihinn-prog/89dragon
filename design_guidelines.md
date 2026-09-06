# Jade Royale Mobile App - Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required:** Yes - The app connects to an existing casino platform with user accounts, balances, and game history.

**Implementation:**
- Use **JWT token authentication** via existing API: `POST https://bxbet.asia/api/login`
- On first launch after installation, show login screen after splash video
- Store JWT token securely using `expo-secure-store`
- Include "Remember Me" option to persist login state
- Auth screens (Login only - registration happens via web platform):
  - Username/password fields
  - "Forgot Password" link (opens web browser to platform)
  - Login button with loading state
- Profile screen includes:
  - Username display
  - Real-time balance display (refreshed via `GET /api/mobile/balance/refresh`)
  - Settings access
  - Logout button (confirmation alert required)

### Navigation
**Root Navigation:** Custom Hybrid Architecture

Given the unique landscape-first orientation and gaming focus:
- **Landscape Mode (Default):** Persistent left sidebar navigation with category filters
- **No Tab Bar:** Categories accessed via left sidebar icons
- **Stack Navigation:** For settings, profile, and modals
- **Orientation Lock:** Landscape-only except during slot gameplay (auto-rotate to portrait when slot game launches)

**Navigation Structure:**
1. **Splash Screen** (first launch only) - Video player, full-screen
2. **Main Game Gallery** - Landscape, sidebar navigation
3. **Game Player** - WebSocket-based, orientation varies by game type
4. **Profile/Settings** - Modal overlay in landscape
5. **Account Management** - Stack screens

### Screen Specifications

#### 1. Splash Screen (First Launch Only)
- **Purpose:** Brand introduction via video
- **Layout:**
  - Full-screen video player (attached video asset)
  - No skip button - plays once completely
  - Smooth fade transition to login/main screen
  - No header, no navigation
- **Safe Area:** Full screen, ignore all insets
- **After Completion:** Navigate to Login (if not authenticated) or Main Gallery (if token exists)

#### 2. Login Screen
- **Purpose:** Authenticate user to access games
- **Layout:**
  - Custom header: Jade Royale logo centered, no back button
  - Scrollable form (vertically centered when keyboard hidden)
  - Glass-morphism card containing:
    - Username input field
    - Password input field (secure)
    - "Forgot Password?" link
    - Login button (full-width, neon glow effect)
  - Background: Animated gradient (green-purple-blue-pink cycle)
- **Safe Area:** 
  - Top: `insets.top + Spacing.xl`
  - Bottom: `insets.bottom + Spacing.xl`

#### 3. Main Game Gallery (Landscape)
- **Purpose:** Browse and select games by category
- **Layout:**
  - **Left Sidebar (Fixed, 80px width):**
    - Category icon buttons stacked vertically
    - Icons: Hot (flame), Favorites (heart), Slots (777), Arcade (joystick)
    - Selected category has neon glow pulse animation
    - Bottom: Settings gear icon
  - **Header (Transparent):**
    - App logo (left, small)
    - User balance display (right): "Balance: $XXX.XX" with refresh icon
    - Profile avatar (far right)
  - **Main Content Area:**
    - Horizontally scrolling carousel (Netflix-style)
    - Two rows of game thumbnails
    - Each game card: 
      - Thumbnail image (16:9 aspect ratio)
      - Title overlay on bottom
      - Favorite heart icon (top-right corner)
      - Subtle neon border on focus/hover
    - Pagination dots below carousel
- **Scrollable:** Horizontal carousel only
- **Safe Area:**
  - Left: `80px (sidebar) + Spacing.lg`
  - Right: `insets.right + Spacing.lg`
  - Top: `headerHeight + Spacing.lg`
  - Bottom: `insets.bottom + Spacing.lg`
- **Background Music:** Auto-plays on this screen, controlled via settings

#### 4. Game Player Screen
- **Purpose:** WebSocket-connected gameplay
- **Layout:**
  - Full-screen game canvas/WebView
  - Minimal UI overlay:
    - Back button (top-left, semi-transparent black circle)
    - Balance display (top-right, glass-morphism card)
  - Orientation: Auto-rotate based on game type
    - Slots: Portrait mode
    - Arcade: Landscape mode
- **Safe Area:** Game content respects all insets, overlay buttons have `Spacing.lg` padding

#### 5. Profile Screen (Modal)
- **Purpose:** View account details and access settings
- **Layout:**
  - Modal presentation (slides from right in landscape)
  - Header: "Profile" title, close X button (right)
  - Scrollable content:
    - Avatar (centered, large)
    - Username
    - Email
    - Current balance (large, neon text)
    - "Settings" button
    - "Logout" button (red/destructive style)
  - Background: Glass-morphism with gradient backdrop
- **Safe Area:** Standard modal insets

#### 6. Settings Screen (Stack)
- **Purpose:** App preferences and audio control
- **Layout:**
  - Standard navigation header with back button
  - Scrollable list:
    - **Audio Section:**
      - "Background Music" toggle switch
      - Volume slider (if music enabled)
    - **Account Section:**
      - "Change Password" (opens web browser)
      - "Delete Account" (deep link, requires double confirmation)
    - **About Section:**
      - App version
      - Terms of Service link
      - Privacy Policy link
- **Safe Area:** Standard screen insets

## Design System

### Color Palette

**Primary Theme: Rainbow Neon Dragon Princess**

- **Gradients (Animated):**
  - Phase 1: `#00FF87` (neon green) → `#A020F0` (neon purple)
  - Phase 2: `#A020F0` (neon purple) → `#0099FF` (electric blue)
  - Phase 3: `#0099FF` (electric blue) → `#FF1493` (neon pink)
  - Background uses continuous 10-second cycle through all phases

- **Accent Colors:**
  - Neon Green: `#00FF87` - Active states, success
  - Neon Purple: `#A020F0` - Selected items, highlights
  - Electric Blue: `#0099FF` - Links, secondary actions
  - Neon Pink: `#FF1493` - Favorites, special features
  - Gold: `#FFD700` - Balance display, premium elements

- **Neutrals (Glass-morphism):**
  - Dark Glass: `rgba(0, 0, 0, 0.4)` with backdrop blur
  - Light Glass: `rgba(255, 255, 255, 0.1)` with backdrop blur
  - Text Light: `#FFFFFF`
  - Text Dim: `rgba(255, 255, 255, 0.7)`

### Typography

- **Headings:** Orbitron (futuristic/neon aesthetic) or system bold
  - H1: 32px, bold, neon glow effect
  - H2: 24px, bold
  - H3: 18px, semi-bold
- **Body:** System default
  - Regular: 16px
  - Small: 14px
- **Balance Display:** 28px, bold, gold color with subtle glow
- **Game Titles:** 14px, bold, white with text shadow

### Visual Design

**IMPORTANT PRINCIPLES:**
- All touchable elements have **neon glow pulse animation** on press (0.3s duration)
- Floating buttons use subtle drop shadow:
  - shadowOffset: { width: 0, height: 4 }
  - shadowOpacity: 0.3
  - shadowRadius: 8
  - shadowColor: Current neon accent color
- **NO EMOJIS** - Use Feather icons for all UI elements
- Glass-morphism cards have:
  - Background: `rgba(255, 255, 255, 0.05)`
  - Border: 1px solid `rgba(255, 255, 255, 0.1)`
  - Backdrop filter: blur(10px)
  - Border radius: 12px

**Animations:**
- Gradient background: 10-second continuous cycle
- Category selection: Neon glow pulse (0.5s ease-in-out)
- Game card hover: Scale 1.05, neon border glow
- Balance update: Shimmer effect on value change

### Critical Assets

**Required Generated Assets:**
1. **Jade Royale Logo** - Rainbow neon style with dragon silhouette, suitable for dark backgrounds
2. **Category Icons (4 total):**
   - Hot: Flame icon with orange-to-red gradient
   - Favorites: Heart icon with pink neon glow
   - Slots: Triple-7 or slot machine icon with gold gradient
   - Arcade: Retro joystick icon with multi-color neon
3. **Default Avatar Placeholder** - Abstract geometric dragon pattern in neon colors
4. **Game Thumbnail Placeholders (3-5 variations)** - Abstract neon patterns as fallback for missing game images

**User-Provided Asset:**
- Splash screen video (attached) - plays on first launch

**Notes:**
- Actual game thumbnails loaded from API: `GET /api/games` returns game metadata
- All icons use Feather icon set from `@expo/vector-icons`
- Dragon/princess theme conveyed through gradient colors, not literal imagery

### Accessibility
- Minimum touch target: 44x44px (iOS HIG standard)
- Text contrast ratio 4.5:1 against gradient backgrounds (use text shadows if needed)
- All interactive elements have visual feedback (glow animation)
- Balance and critical info use high-contrast gold on dark glass
- Support for reduced motion preference (disable gradient animation, keep static gradient)