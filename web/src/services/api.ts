import { API_BASE_URL, API_KEY, IMAGE_BASE_URL, GAME_LAUNCHER_BASE_URL } from './config';

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
  orientation?: 'portrait' | 'landscape' | 'both';
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

export interface DailyRewardStatus {
  can_claim: boolean;
  reward_amount: string;
  last_claimed: string | null;
  next_claim_available: string;
  current_day?: number;
  claimed_days?: number[];
  streak?: number;
}

export interface Session {
  id: string;
  ip_address: string;
  user_agent: string;
  last_activity: string;
}

export interface GameActivity {
  id: number;
  game: string;
  bet: string;
  win: string;
  created_at: string;
}

export interface WheelConfig {
  segments: WheelSegment[];
  available_spins: number;
}

export interface WheelSegment {
  id: number;
  label: string;
  value: number;
  color?: string;
}

export interface WheelSpinResult {
  prize: string;
  amount: number;
  new_balance: number;
}

let onUnauthorizedCallback: (() => void) | null = null;
export function setOnUnauthorizedCallback(cb: () => void) {
  onUnauthorizedCallback = cb;
}

async function apiRequest<T>(
  endpoint: string,
  token?: string | null,
  options: RequestInit = {},
  skipLogout = false
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    const text = await response.text();

    if (response.status === 401) {
      const critical = ['/mobile/profile', '/mobile/balance'];
      if (onUnauthorizedCallback && !skipLogout && critical.some(e => endpoint.startsWith(e))) {
        onUnauthorizedCallback();
      }
      return { success: false, error: 'Session expired - please log in again' };
    }

    let data: T;
    try {
      data = JSON.parse(text);
    } catch {
      return { success: false, error: 'Invalid response from server' };
    }

    if (response.ok) {
      return { success: true, data };
    } else {
      const err = (data as any)?.message || (data as any)?.error || `Request failed (${response.status})`;
      return { success: false, error: err };
    }
  } catch (err) {
    return { success: false, error: 'Network error - please check your connection' };
  }
}

const STATIC_IMAGE_OVERRIDES: Record<string, string> = {
  wolf_moon_rising: 'WolfMoonRisingBS',
  buffalo_blitz: 'BuffaloBlitzPT',
  buffalo_thunder: 'BuffaloThunderVP',
  monster_frenzy: 'MonsterFrenzyPGD',
  vegas_777: 'Vegas777KA',
  gates_of_olympus: 'GatesofOlympus',
  aztec_gems: 'AztecGemsPM',
  jokers_jewels: 'JokersJewelPM',
  bird_hunter: 'BirdHunterVP',
  bugs_paradise_100: 'BugsParadise100VP',
  spongebob: 'SpongeBobKA',
  king_kings_rampage: 'KingKingsRampageKA',
  master_of_the_deep: 'MasterOfTheDeepKA',
  fishermans_wharf: 'FishermansWharfVP',
  leprechaun_goes_wild: 'LeprechaunGoesWildPG',
  hot_spin_deluxe: 'HotSpinDeluxeISB',
  wild_ape: 'WildApeISB',
  aztec_gold_megaways: 'AztecGoldMegawaysISB',
  wild_rubys: 'WildRubiesGM',
  crystal_ball: 'CrystalBallBS',
  funky_monkey: 'FunkyMonkeyPT',
  big_red: 'BigRedAT',
  choy_sun_doa: 'ChoySunDoaBS',
  egg_and_rooster: 'EggAndRoosterBS',
  bars_and_sevens: 'BarsAndSevensGT',
  cash_runner: 'CashRunnerBS',
  money: 'MoneyBS',
  fantasy_777: 'Fantasy777BS',
  deuces_wild: 'DeucesWildAM',
  bingo: 'BingoAM',
  all_american: 'AllAmericanPokerAM',
  last_blast_keno: 'LastBlastKenoBS',
  black_jack: 'BlackJackAM',
  lucky_keno: 'LuckyKenoBS',
  virtual_roulette: 'VirtualRouletteBS',
  joker_poker: 'JokerPokerBS',
  king_octopus: 'KingOctopusKA',
  one_shot_fishing: 'OneShotFishingKA',
  bull_fiesta: 'BullFiestaPM',
};

function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

export function getGameImageUrl(game: Game): string {
  if (game.image_url) {
    return game.image_url.startsWith('http') ? game.image_url : `${IMAGE_BASE_URL}${game.image_url.startsWith('/') ? '' : '/'}${game.image_url}`;
  }
  if (game.image) {
    if (game.image.startsWith('http')) return game.image;
    if (game.image.startsWith('/')) return `${IMAGE_BASE_URL}${game.image}`;
    if (/\.(jpg|png|webp)$/i.test(game.image)) return `${IMAGE_BASE_URL}/frontend/Default/ico/${game.image}`;
    return `${IMAGE_BASE_URL}/frontend/Default/ico/${game.image}.jpg`;
  }
  const override = STATIC_IMAGE_OVERRIDES[game.name];
  if (override) return `${IMAGE_BASE_URL}/frontend/Default/ico/${override}.jpg`;
  return `${IMAGE_BASE_URL}/frontend/Default/ico/${toPascalCase(game.name)}.jpg`;
}

const LAUNCHER_NAME_OVERRIDES: Record<string, string> = {
  buffalo_thunder: 'BuffaloThunderVP',
  monster_frenzy: 'MonsterFrenzyPGD',
  king_kings_rampage: 'KingKingsRampageKA',
  master_of_the_deep: 'MasterOfTheDeepKA',
  fishermans_wharf: 'FishermansWharfVP',
  bugs_paradise_100: 'BugsParadise100VP',
  bird_hunter: 'BirdHunterVP',
  spongebob: 'SpongeBobKA',
  king_octopus: 'KingOctopusKA',
  one_shot_fishing: 'OneShotFishingKA',
  bull_fiesta: 'BullFiestaPM',
};

export function getGameLaunchUrl(gameName: string, token: string): string {
  const name = LAUNCHER_NAME_OVERRIDES[gameName] || gameName;
  return `${GAME_LAUNCHER_BASE_URL}/launcher/${name}/${token}`;
}

export function getGameLaunchUrlFromGame(game: Game, token: string): string {
  if (game.launcher_url) return game.launcher_url;
  return getGameLaunchUrl(game.name, token);
}

export async function loginApi(username: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
      },
      body: JSON.stringify({ username, password, app_version: 2, platform: 'web' }),
    });
    const text = await response.text();
    let data: any;
    try { data = JSON.parse(text); } catch { return { success: false, error: 'Invalid server response' }; }
    if (response.ok && data.token) return { success: true, data };
    return { success: false, error: data.message || data.error || 'Invalid credentials' };
  } catch {
    return { success: false, error: 'Unable to connect to server. Please check your connection.' };
  }
}

export async function fetchGames(token: string): Promise<Game[]> {
  const encodedToken = encodeURIComponent(token);
  for (const endpoint of [`/mobile/games?jwt_token=${encodedToken}`, '/mobile/games', '/games']) {
    const result = await apiRequest<any>(endpoint, token, {}, true);
    if (result.success && result.data) {
      let games: Game[] = [];
      if (Array.isArray(result.data)) games = result.data;
      else if (result.data.games) games = result.data.games;
      else if (result.data.data) games = Array.isArray(result.data.data) ? result.data.data : [];
      if (games.length > 0) return games;
    }
  }
  return [];
}

export async function fetchCategories(token: string): Promise<Category[]> {
  const result = await apiRequest<any>('/mobile/games/categories', token);
  if (result.success && result.data) {
    return Array.isArray(result.data) ? result.data : result.data.categories || [];
  }
  return [];
}

export async function fetchUserProfile(token: string): Promise<ApiResponse<any>> {
  return apiRequest('/mobile/profile', token);
}

export async function refreshBalance(token: string): Promise<ApiResponse<{ balance: number }>> {
  return apiRequest('/mobile/balance/refresh', token);
}

export async function addToFavorites(token: string, gameName: string): Promise<ApiResponse<any>> {
  return apiRequest(`/mobile/favorites/add/${gameName}`, token, { method: 'POST' });
}

export async function removeFromFavorites(token: string, gameName: string): Promise<ApiResponse<any>> {
  return apiRequest(`/mobile/favorites/remove/${gameName}`, token, { method: 'DELETE' });
}

export async function getFavorites(token: string): Promise<ApiResponse<any>> {
  return apiRequest('/mobile/favorites', token);
}

export async function getTransactions(token: string): Promise<ApiResponse<Transaction[]>> {
  const result = await apiRequest<any>('/mobile/transactions', token);
  if (result.success && result.data) {
    const txs = Array.isArray(result.data) ? result.data : result.data.transactions || [];
    return { success: true, data: txs };
  }
  return result as ApiResponse<Transaction[]>;
}

export async function getJackpots(token: string): Promise<ApiResponse<Jackpot[]>> {
  const result = await apiRequest<any>('/mobile/jackpots', token);
  if (result.success && result.data) {
    const j = Array.isArray(result.data) ? result.data : result.data.jackpots || [];
    return { success: true, data: j };
  }
  return result as ApiResponse<Jackpot[]>;
}

export async function getDailyRewardStatus(token: string): Promise<ApiResponse<DailyRewardStatus>> {
  return apiRequest('/mobile/daily-rewards/status', token);
}

export async function claimDailyReward(token: string): Promise<ApiResponse<any>> {
  return apiRequest('/mobile/daily-rewards/claim', token, { method: 'POST' });
}

export async function getWheelConfig(token: string): Promise<ApiResponse<WheelConfig>> {
  return apiRequest('/mobile/wheel-fortune/config', token);
}

export async function spinWheel(token: string): Promise<ApiResponse<WheelSpinResult>> {
  return apiRequest('/mobile/wheel-fortune/spin', token, { method: 'POST' });
}

export async function activatePinCode(token: string, code: string): Promise<ApiResponse<any>> {
  return apiRequest('/mobile/voucher/activate', token, {
    method: 'POST',
    body: JSON.stringify({ code: code.trim().toUpperCase() }),
  });
}

export async function changePassword(token: string, currentPassword: string, newPassword: string): Promise<ApiResponse<any>> {
  return apiRequest('/mobile/password/change', token, {
    method: 'POST',
    body: JSON.stringify({ old_password: currentPassword, new_password: newPassword, new_password_confirmation: newPassword }),
  });
}

export async function getSessions(token: string): Promise<ApiResponse<{ sessions: Session[]; total: number }>> {
  return apiRequest('/mobile/sessions', token);
}

export async function invalidateSession(token: string, sessionId: string): Promise<ApiResponse<any>> {
  return apiRequest(`/mobile/sessions/${sessionId}`, token, { method: 'DELETE' });
}

export async function getGameActivity(token: string): Promise<ApiResponse<any>> {
  return apiRequest('/mobile/game-activity', token);
}

export async function getNotifications(token: string): Promise<ApiResponse<any>> {
  return apiRequest('/mobile/notifications', token);
}

export async function markNotificationRead(token: string, id: number): Promise<ApiResponse<any>> {
  return apiRequest(`/mobile/notifications/read/${id}`, token, { method: 'POST' });
}

export async function getRefundsAvailable(token: string): Promise<ApiResponse<any>> {
  return apiRequest('/mobile/refunds/available', token);
}

export async function claimRefunds(token: string): Promise<ApiResponse<any>> {
  return apiRequest('/mobile/refunds/claim', token, { method: 'POST' });
}

export async function updateUserProfile(token: string, data: { name?: string; email?: string; phone?: string }): Promise<ApiResponse<any>> {
  return apiRequest('/mobile/profile/update', token, { method: 'POST', body: JSON.stringify(data) });
}

export async function launchGame(token: string, gameName: string): Promise<ApiResponse<{ url: string; launcher_url?: string }>> {
  return apiRequest(`/mobile/games/${gameName}/launch`, token);
}
