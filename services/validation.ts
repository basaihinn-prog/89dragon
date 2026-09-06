export interface ValidationResult<T> {
  valid: boolean;
  data: T | null;
  errors: string[];
}

export interface ValidationOptions {
  allowPartialArrays?: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function validateGame(data: unknown): ValidationResult<import("./api").Game> {
  const errors: string[] = [];

  if (!isObject(data)) {
    return { valid: false, data: null, errors: ["Game data must be an object"] };
  }

  if (!isNumber(data.id)) {
    errors.push("Game id must be a number");
  }

  if (!isString(data.name) || data.name.length === 0) {
    errors.push("Game name must be a non-empty string");
  }

  if (data.title !== undefined && !isString(data.title)) {
    errors.push("Game title must be a string");
  }

  if (data.gamebank !== undefined && !isString(data.gamebank)) {
    errors.push("Game gamebank must be a string");
  }

  if (data.device !== undefined && !isString(data.device) && !isNumber(data.device)) {
    errors.push("Game device must be a string or number");
  }

  if (errors.length > 0) {
    return { valid: false, data: null, errors };
  }

  const game: import("./api").Game = {
    id: data.id as number,
    name: data.name as string,
    title: isString(data.title) ? data.title : data.name as string,
    gamebank: isString(data.gamebank) ? data.gamebank : "",
    device: data.device !== undefined ? data.device as (string | number) : 0,
    view: isNumber(data.view) ? data.view : undefined,
    image: isString(data.image) ? data.image : undefined,
    image_url: isString(data.image_url) ? data.image_url : undefined,
    category_id: isNumber(data.category_id) ? data.category_id : undefined,
    categories: isArray(data.categories) ? data.categories.filter(isString) : undefined,
    orientation: validateOrientation(data.orientation),
    launcher_url: isString(data.launcher_url) ? data.launcher_url : undefined,
    denomination: isString(data.denomination) ? data.denomination : undefined,
    label: isString(data.label) ? data.label : null,
    scale_mode: isString(data.scale_mode) ? data.scale_mode : undefined,
  };

  return { valid: true, data: game, errors: [] };
}

function validateOrientation(value: unknown): "portrait" | "landscape" | "both" | undefined {
  if (value === "portrait" || value === "landscape" || value === "both") {
    return value;
  }
  return undefined;
}

export function validateGamesArray(
  data: unknown,
  options: ValidationOptions = {}
): ValidationResult<import("./api").Game[]> {
  const { allowPartialArrays = false } = options;

  if (!isArray(data)) {
    return { valid: false, data: null, errors: ["Games data must be an array"] };
  }

  if (data.length === 0) {
    return { valid: true, data: [], errors: [] };
  }

  const games: import("./api").Game[] = [];
  const errors: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const result = validateGame(data[i]);
    if (result.valid && result.data) {
      games.push(result.data);
    } else {
      errors.push(`Game at index ${i}: ${result.errors.join(", ")}`);
      if (!allowPartialArrays) {
        return { valid: false, data: null, errors };
      }
    }
  }

  if (!allowPartialArrays && errors.length > 0) {
    return { valid: false, data: null, errors };
  }

  if (allowPartialArrays && games.length === 0) {
    return { valid: false, data: null, errors };
  }

  return { valid: true, data: games, errors };
}

export function validateCategory(data: unknown): ValidationResult<import("./api").Category> {
  const errors: string[] = [];

  if (!isObject(data)) {
    return { valid: false, data: null, errors: ["Category data must be an object"] };
  }

  if (!isNumber(data.id)) {
    errors.push("Category id must be a number");
  }

  if (!isString(data.title) || data.title.length === 0) {
    errors.push("Category title must be a non-empty string");
  }

  if (data.slug !== undefined && !isString(data.slug)) {
    errors.push("Category slug must be a string");
  }

  if (errors.length > 0) {
    return { valid: false, data: null, errors };
  }

  const category: import("./api").Category = {
    id: data.id as number,
    title: data.title as string,
    slug: isString(data.slug) ? data.slug : (data.title as string).toLowerCase().replace(/\s+/g, "-"),
    position: isNumber(data.position) ? data.position : undefined,
  };

  return { valid: true, data: category, errors: [] };
}

export function validateTransaction(data: unknown): ValidationResult<import("./api").Transaction> {
  const errors: string[] = [];

  if (!isObject(data)) {
    return { valid: false, data: null, errors: ["Transaction data must be an object"] };
  }

  if (!isNumber(data.id)) {
    errors.push("Transaction id must be a number");
  }

  if (!isString(data.type)) {
    errors.push("Transaction type must be a string");
  }

  if (!isString(data.sum) && !isNumber(data.sum)) {
    errors.push("Transaction sum must be a string or number");
  }

  if (!isString(data.created_at)) {
    errors.push("Transaction created_at must be a string");
  }

  if (data.status !== undefined && !isNumber(data.status)) {
    errors.push("Transaction status must be a number");
  }

  if (errors.length > 0) {
    return { valid: false, data: null, errors };
  }

  const transaction: import("./api").Transaction = {
    id: data.id as number,
    type: data.type as string,
    sum: String(data.sum),
    system: isString(data.system) ? data.system : "",
    title: isString(data.title) ? data.title : "",
    status: isNumber(data.status) ? data.status : 0,
    created_at: data.created_at as string,
  };

  return { valid: true, data: transaction, errors: [] };
}

export function validateUser(data: unknown): ValidationResult<{
  id: number;
  username: string;
  email: string;
  balance: number;
  phone?: string;
  avatar?: string;
  api_token?: string;
  user_id?: number;
  shop_id?: number;
}> {
  const errors: string[] = [];

  if (!isObject(data)) {
    return { valid: false, data: null, errors: ["User data must be an object"] };
  }

  if (!isNumber(data.id)) {
    errors.push("User id must be a number");
  }

  const username = data.username ?? data.name;
  if (!isString(username)) {
    errors.push("User username or name must be a string");
  }

  let balance: number | null = null;
  if (isNumber(data.balance)) {
    balance = data.balance;
  } else if (isString(data.balance)) {
    const parsed = parseFloat(data.balance);
    if (!isNaN(parsed)) {
      balance = parsed;
    } else {
      errors.push("User balance string is not a valid number");
    }
  } else if (data.balance !== undefined) {
    errors.push("User balance must be a number or numeric string");
  }

  if (errors.length > 0) {
    return { valid: false, data: null, errors };
  }

  const user = {
    id: data.id as number,
    user_id: isNumber(data.user_id) ? data.user_id : undefined,
    shop_id: isNumber(data.shop_id) ? data.shop_id : undefined,
    username: username as string,
    email: isString(data.email) ? data.email : "",
    balance: balance ?? 0,
    phone: isString(data.phone) ? data.phone : undefined,
    avatar: isString(data.avatar) ? data.avatar : undefined,
    api_token: isString(data.api_token) ? data.api_token : undefined,
  };

  return { valid: true, data: user, errors: [] };
}

export function validateDailyRewardStatus(data: unknown): ValidationResult<import("./api").DailyRewardStatus> {
  const errors: string[] = [];

  if (!isObject(data)) {
    return { valid: false, data: null, errors: ["Daily reward status must be an object"] };
  }

  if (!isBoolean(data.can_claim)) {
    errors.push("can_claim must be a boolean");
  }

  if (!isString(data.reward_amount) && !isNumber(data.reward_amount)) {
    errors.push("reward_amount must be a string or number");
  }

  if (errors.length > 0) {
    return { valid: false, data: null, errors };
  }

  const status: import("./api").DailyRewardStatus = {
    can_claim: data.can_claim as boolean,
    reward_amount: String(data.reward_amount),
    last_claimed: isString(data.last_claimed) ? data.last_claimed : null,
    next_claim_available: isString(data.next_claim_available) ? data.next_claim_available : "",
    current_day: isNumber(data.current_day) ? data.current_day : undefined,
    claimed_days: isArray(data.claimed_days) ? data.claimed_days.filter(isNumber) : undefined,
    streak: isNumber(data.streak) ? data.streak : undefined,
  };

  return { valid: true, data: status, errors: [] };
}

export function validateWheelFortuneConfig(data: unknown): ValidationResult<import("./api").WheelFortuneConfig> {
  const errors: string[] = [];

  if (!isObject(data)) {
    return { valid: false, data: null, errors: ["Wheel fortune config must be an object"] };
  }

  if (!isBoolean(data.enabled)) {
    errors.push("enabled must be a boolean");
  }

  if (!isBoolean(data.can_spin)) {
    errors.push("can_spin must be a boolean");
  }

  if (!isObject(data.wheels)) {
    errors.push("wheels must be an object");
  } else {
    const wheelsData = data.wheels as Record<string, unknown>;
    if (!isArray(wheelsData.wheel1)) {
      errors.push("wheels.wheel1 must be an array");
    }
    if (!isArray(wheelsData.wheel2)) {
      errors.push("wheels.wheel2 must be an array");
    }
    if (!isArray(wheelsData.wheel3)) {
      errors.push("wheels.wheel3 must be an array");
    }
  }

  if (!isNumber(data.wager)) {
    errors.push("wager must be a number");
  }

  if (!isNumber(data.current_wheel)) {
    errors.push("current_wheel must be a number");
  }

  if (!isArray(data.unlocked_wheels)) {
    errors.push("unlocked_wheels must be an array");
  }

  if (!isString(data.user_balance)) {
    errors.push("user_balance must be a string");
  }

  if (errors.length > 0) {
    return { valid: false, data: null, errors };
  }

  const wheelsData = data.wheels as Record<string, unknown>;
  const wheels = {
    wheel1: (wheelsData.wheel1 as unknown[]).filter(isNumber),
    wheel2: (wheelsData.wheel2 as unknown[]).filter(isNumber),
    wheel3: (wheelsData.wheel3 as unknown[]).filter(isNumber),
  };

  const config: import("./api").WheelFortuneConfig = {
    enabled: data.enabled as boolean,
    wager: data.wager as number,
    wheels,
    unlocked_wheels: (data.unlocked_wheels as unknown[]).filter(isNumber),
    current_wheel: data.current_wheel as number,
    can_unlock_next: isBoolean(data.can_unlock_next) ? data.can_unlock_next : false,
    user_balance: data.user_balance as string,
    can_spin: data.can_spin as boolean,
  };

  return { valid: true, data: config, errors: [] };
}

export function validateSession(data: unknown): ValidationResult<import("./api").Session> {
  const errors: string[] = [];

  if (!isObject(data)) {
    return { valid: false, data: null, errors: ["Session must be an object"] };
  }

  if (!isString(data.id) && !isNumber(data.id)) {
    errors.push("Session id must be a string or number");
  }

  if (!isString(data.last_activity)) {
    errors.push("Session last_activity must be a string");
  }

  if (errors.length > 0) {
    return { valid: false, data: null, errors };
  }

  const session: import("./api").Session = {
    id: String(data.id),
    ip_address: isString(data.ip_address) ? data.ip_address : "",
    user_agent: isString(data.user_agent) ? data.user_agent : "",
    last_activity: data.last_activity as string,
  };

  return { valid: true, data: session, errors: [] };
}

export function validateGameStats(data: unknown): ValidationResult<import("./api").GameStats> {
  const errors: string[] = [];

  if (!isObject(data)) {
    return { valid: false, data: null, errors: ["Game stats must be an object"] };
  }

  if (!isString(data.total_bets) && !isNumber(data.total_bets)) {
    errors.push("total_bets must be a string or number");
  }

  if (!isString(data.total_wins) && !isNumber(data.total_wins)) {
    errors.push("total_wins must be a string or number");
  }

  if (!isNumber(data.games_played)) {
    errors.push("games_played must be a number");
  }

  if (errors.length > 0) {
    return { valid: false, data: null, errors };
  }

  const stats: import("./api").GameStats = {
    total_bets: String(data.total_bets),
    total_wins: String(data.total_wins),
    games_played: data.games_played as number,
  };

  return { valid: true, data: stats, errors: [] };
}

export function extractDataFromResponse<T>(
  response: unknown,
  dataKey?: string
): T | null {
  if (!isObject(response)) return null;

  if (dataKey && response[dataKey] !== undefined) {
    return response[dataKey] as T;
  }

  if (response.data !== undefined) {
    return response.data as T;
  }

  return response as T;
}

export function normalizeApiResponse<T>(
  response: unknown,
  validator: (data: unknown) => ValidationResult<T>
): { success: boolean; data: T | null; error?: string } {
  if (!isObject(response)) {
    return { success: false, data: null, error: "Invalid response format" };
  }

  const apiSuccess = response.success === true || response.status === "success";
  const error = isString(response.error) ? response.error : 
                isString(response.message) ? response.message : undefined;

  if (!apiSuccess) {
    return { success: false, data: null, error: error || "Request failed" };
  }

  const data = extractDataFromResponse<unknown>(response);
  
  const validationResult = validator(data);
  if (!validationResult.valid) {
    console.error("API response validation failed:", validationResult.errors);
    return { 
      success: false, 
      data: null,
      error: validationResult.errors[0] || "Invalid data format"
    };
  }
  
  return { 
    success: true, 
    data: validationResult.data,
  };
}

export function isErrorResponse(response: unknown): response is { success: false; error: string } {
  return (
    isObject(response) &&
    response.success === false &&
    isString(response.error)
  );
}

export function isApiResponse<T>(response: unknown): response is { success: boolean; data?: T } {
  return isObject(response) && isBoolean(response.success);
}
