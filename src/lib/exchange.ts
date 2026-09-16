/** Fallback COP per 1 USD, used only if the live rate can't be fetched. */
export const FALLBACK_USD_COP = 4000

/**
 * Fetches the current exchange rate as COP per 1 USD.
 * Uses open.er-api.com (free, no key, CORS-enabled). Returns null on failure
 * so the caller can fall back to manual entry.
 */
export async function fetchUsdToCop(): Promise<number | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) return null
    const data = await res.json()
    const cop = data?.rates?.COP
    return typeof cop === 'number' && cop > 0 ? cop : null
  } catch {
    return null
  }
}
