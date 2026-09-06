import { API_BASE_URL, API_KEY, WS_BASE_URL, IMAGE_BASE_URL, GAME_LAUNCHER_BASE_URL } from "./config";

const MAX_CACHE_SIZE = 50;
const CACHE_ENTRY_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const requestTimestamps: Map<string, number> = new Map();
const requestCache: Map<string, CacheEntry<any>> = new Map();
const MIN_REQUEST_INTERVAL = 5000;

function cleanupExpiredCacheEntries(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];
  
  requestTimestamps.forEach((timestamp, key) => {
    if (now - timestamp > CACHE_ENTRY_TTL) {
      expiredKeys.push(key);
    }
  });
  
  expiredKeys.forEach(key => {
    requestTimestamps.delete(key);
    requestCache.delete(key);
  });
}

function enforceMaxCacheSize(): void {
  if (requestCache.size <= MAX_CACHE_SIZE) return;
  
  const entries = Array.from(requestCache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  const entriesToRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
  entriesToRemove.forEach(([key]) => {
    requestCache.delete(key);
    requestTimestamps.delete(key);
  });
}

function shouldThrottleRequest(endpoint: string): boolean {
  const now = Date.now();
  const lastRequest = requestTimestamps.get(endpoint);
  
  if (lastRequest && now - lastRequest < MIN_REQUEST_INTERVAL) {
    return true;
  }
  
  requestTimestamps.set(endpoint, now);
  
  if (requestTimestamps.size > MAX_CACHE_SIZE * 2) {
    cleanupExpiredCacheEntries();
  }
  
  return false;
}

function getCachedResult<T>(endpoint: string): T | null {
  const entry = requestCache.get(endpoint);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_ENTRY_TTL) {
    requestCache.delete(endpoint);
    return null;
  }
  
  return entry.data;
}

function setCachedResult<T>(endpoint: string, data: T): void {
  requestCache.set(endpoint, { data, timestamp: Date.now() });
  enforceMaxCacheSize();
}

export function clearApiCache(): void {
  requestCache.clear();
  requestTimestamps.clear();
}

export interface Game {
  id: number;
  name: string;
  title: string;
  gamebank: string;
  device: string | number;
  view?: number;
  image?: string;
  image_url?: string;
  category_id?: number;
  categories?: string[];
  orientation?: "portrait" | "landscape" | "both";
  launcher_url?: string;
  denomination?: string;
  label?: string | null;
  scale_mode?: string;
}

export interface Category {
  id: number;
  title: string;
  slug: string;
  position?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(callback: () => void) {
  onUnauthorizedCallback = callback;
}

async function apiRequest<T>(
  endpoint: string,
  token?: string | null,
  options: RequestInit = {},
  skipLogoutOnUnauthorized: boolean = false
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const responseText = await response.text();
    
    if (response.status === 401) {
      console.warn(`401 Unauthorized from ${endpoint} - token may have expired`);
      // Only trigger logout for critical auth endpoints, not for game/content endpoints
      const criticalEndpoints = ["/mobile/profile", "/mobile/balance"];
      const isCriticalEndpoint = criticalEndpoints.some(e => endpoint.startsWith(e));
      if (onUnauthorizedCallback && !skipLogoutOnUnauthorized && isCriticalEndpoint) {
        onUnauthorizedCallback();
      }
      return { success: false, error: "Session expired - please log in again" };
    }
    
    let data: any;
    
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(`Invalid JSON response from ${endpoint}:`, responseText.substring(0, 200));
      return { success: false, error: "Invalid response from server" };
    }

    if (response.ok) {
      return { success: true, data };
    } else {
      const errorMsg = data.message || data.error || `Request failed (${response.status})`;
      console.warn(`API Error (${endpoint}): ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error(`API Network Error (${endpoint}):`, error);
    return { success: false, error: "Network error - please check your connection" };
  }
}

export async function fetchGames(token: string | null): Promise<Game[]> {
  if (!token) {
    return [];
  }
  
  const encodedToken = encodeURIComponent(token);
  
  // Try /mobile/games with jwt_token query parameter (documented format)
  const result1 = await apiRequest<{ games: Game[] } | Game[] | any>(`/mobile/games?jwt_token=${encodedToken}`, token, {}, true);
  
  if (result1.success && result1.data) {
    let games: Game[] = [];
    if (Array.isArray(result1.data)) {
      games = result1.data;
    } else if (result1.data.games) {
      games = result1.data.games;
    } else if (result1.data.data) {
      games = Array.isArray(result1.data.data) ? result1.data.data : [];
    }
    if (games.length > 0) {
      return games;
    }
  }
  
  // Fallback: try /mobile/games with just Authorization header (GET only)
  const result3 = await apiRequest<{ games: Game[] } | Game[] | any>("/mobile/games", token, {}, true);
  
  if (result3.success && result3.data) {
    let games: Game[] = [];
    if (Array.isArray(result3.data)) {
      games = result3.data;
    } else if (result3.data.games) {
      games = result3.data.games;
    } else if (result3.data.data) {
      games = Array.isArray(result3.data.data) ? result3.data.data : [];
    }
    if (games.length > 0) {
      return games;
    }
  }
  
  // Try /games endpoint as last resort
  const result4 = await apiRequest<{ games: Game[] } | Game[] | any>("/games", token, {}, true);
  
  if (result4.success && result4.data) {
    let games: Game[] = [];
    if (Array.isArray(result4.data)) {
      games = result4.data;
    } else if (result4.data.games) {
      games = result4.data.games;
    } else if (result4.data.data) {
      games = Array.isArray(result4.data.data) ? result4.data.data : [];
    }
    if (games.length > 0) {
      return games;
    }
  }
  
  return [];
}

export async function fetchCategories(token: string | null): Promise<Category[]> {
  // Use /mobile/games/categories endpoint
  const result = await apiRequest<{ categories: Category[], total?: number } | Category[]>("/mobile/games/categories", token);
  
  if (result.success && result.data) {
    const categories = Array.isArray(result.data) ? result.data : result.data.categories || [];
    return categories;
  }
  return [];
}

export async function fetchUserProfile(token: string): Promise<ApiResponse<any>> {
  return apiRequest("/mobile/profile", token);
}

export async function refreshBalance(token: string): Promise<ApiResponse<{ balance: number }>> {
  return apiRequest("/mobile/balance/refresh", token);
}

export async function addToFavorites(token: string, gameName: string): Promise<ApiResponse<any>> {
  return apiRequest(`/mobile/favorites/add/${gameName}`, token, { method: "POST" });
}

export async function removeFromFavorites(token: string, gameName: string): Promise<ApiResponse<any>> {
  return apiRequest(`/mobile/favorites/remove/${gameName}`, token, { method: "DELETE" });
}

export async function getFavorites(token: string): Promise<ApiResponse<Game[]>> {
  return apiRequest("/mobile/favorites", token);
}

export async function fetchGameDetails(token: string, gameName: string): Promise<ApiResponse<Game>> {
  return apiRequest(`/mobile/games/${gameName}`, token);
}

function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

const STATIC_IMAGE_OVERRIDES: Record<string, string> = {
  "wolf_moon_rising": "WolfMoonRisingBS",
  "buffalo_blitz": "BuffaloBlitzPT",
  "buffalo_thunder": "BuffaloThunderVP",
  "BuffaloThunderVP": "BuffaloThunderVP",
  "buffalothundervp": "BuffaloThunderVP",
  "BuffaloAT": "BuffaloAT",
  "buffaloat": "BuffaloAT",
  "monster_frenzy": "MonsterFrenzyPGD",
  "vegas_777": "Vegas777KA",
  "gates_of_olympus": "GatesofOlympus",
  "aztec_gems": "AztecGemsPM",
  "jokers_jewels": "JokersJewelPM",
  "bird_hunter": "BirdHunterVP",
  "bugs_paradise_100": "BugsParadise100VP",
  "spongebob": "SpongeBobKA",
  "king_kings_rampage": "KingKingsRampageKA",
  "master_of_the_deep": "MasterOfTheDeepKA",
  "fishermans_wharf": "FishermansWharfVP",
  "leprechaun_goes_wild": "LeprechaunGoesWildPG",
  "hot_spin_deluxe": "HotSpinDeluxeISB",
  "wild_ape": "WildApeISB",
  "aztec_gold_megaways": "AztecGoldMegawaysISB",
  "wild_rubys": "WildRubiesGM",
  "crystal_ball": "CrystalBallBS",
  "funky_monkey": "FunkyMonkeyPT",
  "big_red": "BigRedAT",
  "choy_sun_doa": "ChoySunDoaBS",
  "egg_and_rooster": "EggAndRoosterBS",
  "bars_and_sevens": "BarsAndSevensGT",
  "cash_runner": "CashRunnerBS",
  "santa_rudolf": "SantaVSRudolphNET",
  "money": "MoneyBS",
  "MoneyBS": "MoneyBS",
  "moneybs": "MoneyBS",
  "fantasy_777": "Fantasy777BS",
  "deuces_wild": "DeucesWildAM",
  "bingo": "BingoAM",
  "all_american": "AllAmericanPokerAM",
  "last_blast_keno": "LastBlastKenoBS",
  "black_jack": "BlackJackAM",
  "lucky_keno": "LuckyKenoBS",
  "virtual_roulette": "VirtualRouletteBS",
  "joker_poker": "JokerPokerBS",
  "christmas_big_bass_bonanza": "ChristmasBigBassBonanza",
  "lucky_new_year": "LuckyNewYear",
  "king_octopus": "KingOctopusKA",
  "one_shot_fishing": "OneShotFishingKA",
  "bull_fiesta": "BullFiestaPM",
};

export function getGameImageUrl(game: Game): string {
  if (game.image_url) {
    if (game.image_url.startsWith("http")) {
      return game.image_url;
    }
    return `${IMAGE_BASE_URL}${game.image_url.startsWith("/") ? "" : "/"}${game.image_url}`;
  }
  if (game.image) {
    if (game.image.startsWith("http")) {
      return game.image;
    }
    if (game.image.startsWith("/")) {
      return `${IMAGE_BASE_URL}${game.image}`;
    }
    if (game.image.endsWith(".jpg") || game.image.endsWith(".png") || game.image.endsWith(".webp")) {
      return `${IMAGE_BASE_URL}/frontend/Default/ico/${game.image}`;
    }
    return `${IMAGE_BASE_URL}/frontend/Default/ico/${game.image}.jpg`;
  }
  
  const override = STATIC_IMAGE_OVERRIDES[game.name];
  if (override) {
    return `${IMAGE_BASE_URL}/frontend/Default/ico/${override}.jpg`;
  }
  
  const pascalName = toPascalCase(game.name);
  return `${IMAGE_BASE_URL}/frontend/Default/ico/${pascalName}.jpg`;
}

export function getGameFallbackImageUrl(game: Game): string {
  const override = STATIC_IMAGE_OVERRIDES[game.name];
  if (override) {
    return `${IMAGE_BASE_URL}/frontend/Default/ico/${override}.png`;
  }
  const pascalName = toPascalCase(game.name);
  return `${IMAGE_BASE_URL}/frontend/Default/ico/${pascalName}.png`;
}

export function getGameImageUrlAlternatives(game: Game): string[] {
  const alternatives: string[] = [];
  const name = game.name;
  const pascalName = toPascalCase(name);
  const override = STATIC_IMAGE_OVERRIDES[name];
  
  if (game.image_url) {
    const url = game.image_url.startsWith("http") 
      ? game.image_url 
      : `${IMAGE_BASE_URL}${game.image_url.startsWith("/") ? "" : "/"}${game.image_url}`;
    alternatives.push(url);
    
    if (url.endsWith(".jpg")) {
      alternatives.push(url.replace(".jpg", ".png"));
      alternatives.push(url.replace(".jpg", ".webp"));
    } else if (url.endsWith(".png")) {
      alternatives.push(url.replace(".png", ".jpg"));
    }
  }
  
  if (game.image) {
    if (game.image.startsWith("http")) {
      alternatives.push(game.image);
    } else {
      const baseImage = game.image.startsWith("/") 
        ? `${IMAGE_BASE_URL}${game.image}`
        : `${IMAGE_BASE_URL}/frontend/Default/ico/${game.image}`;
      alternatives.push(baseImage);
      if (!game.image.match(/\.(jpg|png|webp)$/i)) {
        alternatives.push(`${baseImage}.jpg`);
        alternatives.push(`${baseImage}.png`);
      }
    }
  }
  
  if (override) {
    alternatives.push(`${IMAGE_BASE_URL}/frontend/Default/ico/${override}.jpg`);
    alternatives.push(`${IMAGE_BASE_URL}/frontend/Default/ico/${override}.png`);
  }
  
  alternatives.push(`${IMAGE_BASE_URL}/frontend/Default/ico/${pascalName}.jpg`);
  alternatives.push(`${IMAGE_BASE_URL}/frontend/Default/ico/${pascalName}.png`);
  alternatives.push(`${IMAGE_BASE_URL}/frontend/Default/ico/${name}.jpg`);
  alternatives.push(`${IMAGE_BASE_URL}/frontend/Default/ico/${name}.png`);
  
  alternatives.push(`${IMAGE_BASE_URL}/frontend/Default/games/${name}.jpg`);
  alternatives.push(`${IMAGE_BASE_URL}/frontend/Default/games/${name}.png`);
  alternatives.push(`${IMAGE_BASE_URL}/img/games/${name}.jpg`);
  alternatives.push(`${IMAGE_BASE_URL}/img/games/${name}.png`);
  
  return [...new Set(alternatives)];
}

export function getWebSocketUrl(gameType: string): string {
  if (gameType === "fish" || gameType === "arcade") {
    return `${WS_BASE_URL}:22180/arcade`;
  }
  return `${WS_BASE_URL}:22150/slots`;
}

export interface Transaction {
  id: number;
  type: string;
  sum: string;
  system: string;
  title: string;
  status: number;
  created_at: string;
}

export interface Jackpot {
  id: number;
  name: string;
  sum: string;
  game: string | null;
  user: string | null;
  date_time: string;
}

export async function getTransactions(token: string): Promise<ApiResponse<Transaction[]>> {
  const result = await apiRequest<{ transactions: Transaction[], total?: number } | Transaction[]>("/mobile/transactions", token);
  if (result.success && result.data) {
    const transactions = Array.isArray(result.data) ? result.data : result.data.transactions || [];
    return { success: true, data: transactions };
  }
  return result as ApiResponse<Transaction[]>;
}

export async function getJackpots(token: string): Promise<ApiResponse<Jackpot[]>> {
  const cacheKey = "/mobile/jackpots";
  
  if (shouldThrottleRequest(cacheKey)) {
    const cached = getCachedResult<Jackpot[]>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }
  }
  
  const result = await apiRequest<{ jackpots: Jackpot[], total?: number } | Jackpot[]>(cacheKey, token);
  if (result.success && result.data) {
    const jackpots = Array.isArray(result.data) ? result.data : result.data.jackpots || [];
    setCachedResult(cacheKey, jackpots);
    return { success: true, data: jackpots };
  }
  return result as ApiResponse<Jackpot[]>;
}

export async function getJackpotWins(token: string): Promise<ApiResponse<Jackpot[]>> {
  return apiRequest("/mobile/jackpots", token);
}

export interface DailyRewardStatus {
  can_claim: boolean;
  reward_amount: string;
  last_claimed: string | null;
  next_claim_available: string;
  current_day?: number;
  claimed_days?: number[];
  streak?: number;
}

export interface RefundsAvailable {
  refunds: string;
  available_to_claim: boolean;
}

export async function getDailyRewardStatus(token: string): Promise<ApiResponse<DailyRewardStatus>> {
  return apiRequest("/mobile/daily-rewards/status", token);
}

export async function claimDailyReward(token: string): Promise<ApiResponse<any>> {
  return apiRequest("/mobile/daily-rewards/claim", token, { method: "POST" });
}

export async function getRefundsAvailable(token: string): Promise<ApiResponse<RefundsAvailable>> {
  return apiRequest("/mobile/refunds/available", token);
}

export async function claimRefunds(token: string): Promise<ApiResponse<any>> {
  return apiRequest("/mobile/refunds/claim", token, { method: "POST" });
}

export async function launchGame(token: string, gameName: string): Promise<ApiResponse<{ url: string; launcher_url?: string }>> {
  return apiRequest(`/mobile/games/${gameName}/launch`, token);
}

const LAUNCHER_NAME_OVERRIDES: Record<string, string> = {
  "buffalo_thunder": "BuffaloThunderVP",
  "monster_frenzy": "MonsterFrenzyPGD",
  "king_kings_rampage": "KingKingsRampageKA",
  "master_of_the_deep": "MasterOfTheDeepKA",
  "fishermans_wharf": "FishermansWharfVP",
  "bugs_paradise_100": "BugsParadise100VP",
  "bugs_paradise_10000": "BugsParadise10000VP",
  "bird_hunter": "BirdHunterVP",
  "spongebob": "SpongeBobKA",
  "fire_phoenix": "FirePhoenixVP",
  "fish_hunter": "FishHunterKA",
  "golden_dragon": "GoldenDragonKA",
  "king_octopus": "KingOctopusKA",
  "one_shot_fishing": "OneShotFishingKA",
  "bull_fiesta": "BullFiestaPM",
};

export function getGameLaunchUrl(gameName: string, userApiToken: string): string {
  const launcherName = LAUNCHER_NAME_OVERRIDES[gameName] || gameName;
  return `${GAME_LAUNCHER_BASE_URL}/launcher/${launcherName}/${userApiToken}`;
}

export function getGameLaunchUrlFromGame(game: Game, userApiToken: string): string {
  if (game.launcher_url) {
    return game.launcher_url;
  }
  return getGameLaunchUrl(game.name, userApiToken);
}

export interface Withdrawal {
  id: number;
  amount: string;
  status: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Shop {
  id: number;
  name: string;
  currency: string;
  balance: string;
}

export async function getWithdrawHistory(token: string): Promise<ApiResponse<{ withdrawals: Withdrawal[], total: number }>> {
  return apiRequest("/mobile/withdraw/history", token);
}

export async function requestWithdraw(token: string, amount: number): Promise<ApiResponse<any>> {
  return apiRequest("/mobile/withdraw/request", token, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function initiateDeposit(token: string, amount: number): Promise<ApiResponse<any>> {
  return apiRequest("/mobile/deposit/initiate", token, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function getNotifications(token: string): Promise<ApiResponse<{ notifications: Notification[], total: number, unread: number }>> {
  return apiRequest("/mobile/notifications", token);
}

export async function markNotificationRead(token: string, notificationId: number): Promise<ApiResponse<any>> {
  return apiRequest(`/mobile/notifications/read/${notificationId}`, token, { method: "POST" });
}

export async function getShopDetails(token: string, shopId: number): Promise<ApiResponse<{ shop: Shop }>> {
  return apiRequest(`/mobile/shops/${shopId}`, token);
}

export interface Session {
  id: string;
  ip_address: string;
  user_agent: string;
  last_activity: string;
}

export interface Bonus {
  id: number;
  name: string | null;
  description: string;
  multiplier: string;
  shop_id: number;
}

export interface GameActivity {
  id: number;
  game: string;
  bet: string;
  win: string;
  created_at: string;
}

export interface GameStats {
  total_bets: string;
  total_wins: string;
  games_played: number;
}

export async function getSessions(token: string): Promise<ApiResponse<{ sessions: Session[], total: number }>> {
  const result = await apiRequest<{ sessions: Session[], total: number }>("/mobile/sessions", token);
  return result;
}

export async function invalidateSession(token: string, sessionId: string): Promise<ApiResponse<any>> {
  return apiRequest(`/mobile/sessions/${sessionId}`, token, { method: "DELETE" });
}

export async function getAvailableBonuses(token: string): Promise<ApiResponse<{ bonuses: Bonus[], total: number }>> {
  const result = await apiRequest<{ bonuses: Bonus[], total: number }>("/mobile/bonuses/available", token);
  return result;
}

export async function claimBonus(token: string, bonusId: number): Promise<ApiResponse<{ amount: string; new_balance?: string; message?: string }>> {
  return apiRequest(`/mobile/bonuses/claim/${bonusId}`, token, { method: "POST" });
}

export async function getGameActivity(token: string): Promise<ApiResponse<{ activity: GameActivity[], total: number }>> {
  const result = await apiRequest<{ activity: GameActivity[], total: number }>("/mobile/game-activity", token);
  return result;
}

export async function getGameStats(token: string): Promise<ApiResponse<GameStats>> {
  return apiRequest("/mobile/game-stats", token);
}

export async function getGameDetails(token: string, gameName: string): Promise<ApiResponse<Game>> {
  return apiRequest(`/mobile/games/${gameName}`, token);
}

export interface PinActivationResult {
  amount_added: string;
  refund_bonus: string;
  old_balance: string;
  new_balance: string;
  currency: string;
  activated_at: string;
}

export interface PinActivationResponse {
  success: boolean;
  message: string;
  data: PinActivationResult;
}

export async function activatePinCode(token: string, code: string): Promise<ApiResponse<PinActivationResponse>> {
  return apiRequest("/mobile/voucher/activate", token, {
    method: "POST",
    body: JSON.stringify({ code: code.trim().toUpperCase() }),
  });
}

export async function activateVoucher(token: string, code: string): Promise<ApiResponse<any>> {
  return apiRequest("/mobile/voucher/activate", token, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function changePassword(token: string, currentPassword: string, newPassword: string): Promise<ApiResponse<any>> {
  return apiRequest("/mobile/password/change", token, {
    method: "POST",
    body: JSON.stringify({ 
      old_password: currentPassword, 
      new_password: newPassword,
      new_password_confirmation: newPassword 
    }),
  });
}

export interface UserProfileUpdate {
  name?: string;
  email?: string;
  phone?: string;
}

export async function updateUserProfile(
  token: string,
  updates: UserProfileUpdate
): Promise<ApiResponse<any>> {
  return apiRequest("/mobile/profile/update", token, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export interface PaypalEmailResponse {
  paypal_email: string | null;
}

export async function getPaypalEmail(token: string): Promise<ApiResponse<PaypalEmailResponse>> {
  return apiRequest("/mobile/paypal-email", token);
}

export async function submitPaypalEmail(token: string, email: string): Promise<ApiResponse<any>> {
  return apiRequest("/mobile/paypal-email", token, {
    method: "POST",
    body: JSON.stringify({ paypal_email: email }),
  });
}

export interface WithdrawalRequest {
  amount: number;
  paymentMethod: "cashapp" | "paypal" | "cash";
  paymentDetails: string;
  username: string;
  timestamp: string;
}

export async function submitWithdrawalRequest(
  token: string,
  request: WithdrawalRequest
): Promise<ApiResponse<any>> {
  return apiRequest("/mobile/withdraw/submit", token, {
    method: "POST",
    body: JSON.stringify({
      amount: request.amount,
      payment_method: request.paymentMethod,
      payment_details: request.paymentDetails,
      username: request.username,
      timestamp: request.timestamp,
      notification_email: "contact@jaderoyale.app",
    }),
  });
}

export interface WheelSegment {
  label: string;
  amount: number;
  color: string;
}

export interface WheelFortuneConfig {
  enabled: boolean;
  wager: number;
  wheels: {
    wheel1: number[];
    wheel2: number[];
    wheel3: number[];
  };
  unlocked_wheels: number[];
  current_wheel: number;
  can_unlock_next: boolean;
  user_balance: string;
  can_spin: boolean;
}

export interface WheelFortuneSpinResult {
  success: boolean;
  wheel: number;
  position: number;
  prize: string;
  prize_amount: number;
  advance_to_next_wheel?: boolean;
  wheel_unlocked?: number | null;
  unlocked_wheels: number[];
  message: string;
  wager_deducted: string;
  new_balance: string;
}

export async function getWheelFortuneConfig(token: string): Promise<ApiResponse<WheelFortuneConfig>> {
  return apiRequest("/mobile/wheel-fortune/config", token);
}

export interface SpinWheelRequest {
  wheel: number;
}

export async function spinWheelFortune(token: string, request: SpinWheelRequest): Promise<ApiResponse<WheelFortuneSpinResult>> {
  return apiRequest("/mobile/wheel-fortune/spin", token, { 
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function uploadAvatar(
  token: string,
  imageUri: string
): Promise<ApiResponse<{ avatar_url: string }>> {
  try {
    const formData = new FormData();
    const filename = imageUri.split("/").pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";
    
    formData.append("avatar", {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await fetch(`${API_BASE_URL}/mobile/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message || "Upload failed" };
  } catch (error) {
    console.error("Avatar upload error:", error);
    return { success: false, error: "Failed to upload avatar" };
  }
}
