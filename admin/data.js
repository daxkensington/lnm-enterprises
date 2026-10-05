const fs = require("fs");
const path = require("path");

const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

// Copy an unreadable/corrupt file aside so it can be inspected. The original
// stays in place so callers never see it as "missing" and overwrite it.
function quarantine(filePath, filename) {
  const dest = `${filePath}.corrupt-${Date.now()}`;
  try {
    fs.copyFileSync(filePath, dest);
    console.error(`readJSON quarantined ${filename} to ${dest}`);
  } catch (copyErr) {
    console.error(`readJSON quarantine failed for ${filename}:`, copyErr.message);
  }
}

// Only a missing file yields the fallback. Any other read or parse failure is
// logged, quarantined and thrown so callers don't write a fallback over data.
function readJSON(filename, fallback = null) {
  const filePath = path.join(dataDir, filename);
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    console.error(`readJSON error for ${filename}:`, err.message);
    quarantine(filePath, filename);
    throw err;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`readJSON parse error for ${filename}:`, err.message);
    quarantine(filePath, filename);
    throw err;
  }
}

const RENAME_RETRY_CODES = new Set(["EPERM", "EACCES", "EBUSY"]);
const RENAME_RETRIES = 5;

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// renameSync replaces an existing destination on both POSIX and Windows, so
// the destination is never absent. On Windows a transient lock (antivirus,
// indexer) can cause EPERM/EACCES/EBUSY, so retry a bounded number of times.
function replaceFile(tmp, filePath) {
  for (let attempt = 0; ; attempt++) {
    try {
      fs.renameSync(tmp, filePath);
      return;
    } catch (err) {
      if (!RENAME_RETRY_CODES.has(err.code) || attempt >= RENAME_RETRIES) throw err;
      sleepSync(20 * (attempt + 1));
    }
  }
}

function writeJSON(filename, data) {
  ensureDataDir();
  const filePath = path.join(dataDir, filename);
  const tmp = filePath + ".tmp";
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    replaceFile(tmp, filePath);
  } catch (err) {
    // Leave the .tmp in place so the write can be retried or recovered.
    console.error(`writeJSON error for ${filename}:`, err.message);
    if (fs.existsSync(tmp)) console.error(`writeJSON left ${tmp} for retry`);
    throw err;
  }
}

const BLOG_CATEGORIES = [
  "Store News",
  "Gas & Fuel",
  "Product Spotlight",
  "Community",
  "Tips & Savings",
  "Vape & Tobacco",
];

// Render a stored draw date as "Month YYYY". Accepts either "YYYY-MM" (new
// month-picker format) or legacy "YYYY-MM-DD". Returns the input unchanged if
// it can't be parsed so legacy free-text values are still readable.
function formatDrawMonth(value, lang = "en") {
  if (!value) return "";
  const m = String(value).match(/^(\d{4})-(\d{2})/);
  if (!m) return String(value);
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  if (month < 1 || month > 12) return String(value);
  const locale = lang === "fr" ? "fr-CA" : "en-CA";
  try {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
  } catch {
    return `${m[1]}-${m[2]}`;
  }
}

module.exports = { readJSON, writeJSON, dataDir, BLOG_CATEGORIES, formatDrawMonth };
