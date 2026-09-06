import AsyncStorage from "@react-native-async-storage/async-storage";

const SPIN_STATE_KEY = "@jade_royale_spin_state";
const LAST_SPIN_TIME_KEY = "@jade_royale_last_spin_time";

export const DAILY_CHECKIN_AMOUNTS = [4, 5, 6, 7, 8, 9, 10];

export const PREDETERMINED_SPIN_RESULTS: { [day: number]: number } = {
  1: 6,
  2: 5,
  3: 4,
  4: 3,
  5: 2,
  6: 1,
  7: 0,
};

export interface SpinState {
  currentDay: number;
  canSpin: boolean;
  lastSpinTime: number | null;
  lastClaimTime: number | null;
}

export async function getSpinState(): Promise<SpinState> {
  try {
    const [stateStr, lastSpinStr] = await Promise.all([
      AsyncStorage.getItem(SPIN_STATE_KEY),
      AsyncStorage.getItem(LAST_SPIN_TIME_KEY),
    ]);
    
    const stored = stateStr ? JSON.parse(stateStr) : null;
    const lastSpinTime = lastSpinStr ? parseInt(lastSpinStr, 10) : null;
    
    return {
      currentDay: stored?.currentDay || 1,
      canSpin: stored?.canSpin || false,
      lastSpinTime,
      lastClaimTime: stored?.lastClaimTime || null,
    };
  } catch (error) {
    console.error("[SpinState] Error reading spin state:", error);
    return { currentDay: 1, canSpin: false, lastSpinTime: null, lastClaimTime: null };
  }
}

export async function enableSpinForDay(day: number): Promise<void> {
  try {
    const current = await getSpinState();
    
    await AsyncStorage.setItem(
      SPIN_STATE_KEY,
      JSON.stringify({
        currentDay: day,
        canSpin: true,
        lastClaimTime: Date.now(),
      })
    );
  } catch (error) {
    console.error("[SpinState] Error enabling spin:", error);
  }
}

export async function markSpinUsed(): Promise<void> {
  try {
    const current = await getSpinState();
    const now = Date.now();
    
    await Promise.all([
      AsyncStorage.setItem(
        SPIN_STATE_KEY,
        JSON.stringify({
          currentDay: current.currentDay,
          canSpin: false,
          lastClaimTime: current.lastClaimTime,
        })
      ),
      AsyncStorage.setItem(LAST_SPIN_TIME_KEY, now.toString()),
    ]);
  } catch (error) {
    console.error("[SpinState] Error marking spin used:", error);
  }
}

export async function getPreDeterminedSpinResult(): Promise<number> {
  try {
    const state = await getSpinState();
    const day = state.currentDay;
    const result = PREDETERMINED_SPIN_RESULTS[day] !== undefined ? PREDETERMINED_SPIN_RESULTS[day] : 0;
    return result;
  } catch (error) {
    console.error("[SpinState] Error getting predetermined result:", error);
    return 0;
  }
}

export async function setLastSpinTime(time: number): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SPIN_TIME_KEY, time.toString());
  } catch (error) {
    console.error("[SpinState] Error setting last spin time:", error);
  }
}

export async function getLastSpinTime(): Promise<number | null> {
  try {
    const stored = await AsyncStorage.getItem(LAST_SPIN_TIME_KEY);
    return stored ? parseInt(stored, 10) : null;
  } catch (error) {
    console.error("[SpinState] Error getting last spin time:", error);
    return null;
  }
}

export async function resetSpinState(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([SPIN_STATE_KEY, LAST_SPIN_TIME_KEY]);
  } catch (error) {
    console.error("[SpinState] Error resetting spin state:", error);
  }
}
