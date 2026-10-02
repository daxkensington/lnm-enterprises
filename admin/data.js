const fs = require("fs");
const path = require("path");

const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function readJSON(filename, fallback = null) {
  try {
    const filePath = path.join(dataDir, filename);
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`readJSON error for ${filename}:`, err.message);
    }
    return fallback;
  }
}

function writeJSON(filename, data) {
  ensureDataDir();
  const filePath = path.join(dataDir, filename);
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  try {
    fs.renameSync(tmp, filePath);
  } catch (err) {
    try {
      fs.rmSync(tmp, { force: true });
    } catch (cleanupErr) {
      console.error(`writeJSON cleanup error for ${filename}:`, cleanupErr.message);
    }
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
