const DAY_MS = 24 * 60 * 60 * 1000;

// Only the server-recorded timestamp establishes freshness. A free-text label
// such as "updated today" cannot remain true indefinitely.
function priceFreshness(prices, now = Date.now()) {
  const at = typeof prices.lastUpdatedAt === 'string' ? Date.parse(prices.lastUpdatedAt) : NaN;
  if (!Number.isFinite(at) || at > now) return { state: 'unknown', at: null };
  return { state: now - at >= DAY_MS ? 'stale' : 'recent', at };
}

module.exports = { priceFreshness };
