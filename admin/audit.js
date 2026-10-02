const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { readJSON, writeJSON, dataDir } = require("./data");

const MAX_AUDIT_ENTRIES = 500;
const ARCHIVE_FILE = "audit-log-archive.json";

// Read the archive without readJSON's fallback-on-error behavior so a corrupt
// or unreadable archive is never mistaken for an empty one and overwritten.
// Returns [] only when the file does not exist yet; throws otherwise.
function readArchiveStrict() {
  let raw;
  try {
    raw = fs.readFileSync(path.join(dataDir, ARCHIVE_FILE), "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`${ARCHIVE_FILE} is not an array`);
  return parsed;
}

function appendAuditLog({ req, actionType, entityType, entityId = null, oldValue = null, newValue = null }) {
  const entries = readJSON("audit-log.json", []);
  entries.push({
    id: crypto.randomBytes(8).toString("hex"),
    timestamp: new Date().toISOString(),
    adminUsername: req.session?.username || "system",
    adminUserId: req.session?.userId || null,
    actionType,
    entityType,
    entityId,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    ipAddress: req.ip || req.connection?.remoteAddress || null,
  });
  // Archive overflow entries before trimming. If archiving fails for any
  // reason, keep the untrimmed log so no entries are dropped.
  if (entries.length > MAX_AUDIT_ENTRIES) {
    const overflow = entries.slice(0, entries.length - MAX_AUDIT_ENTRIES);
    try {
      const archive = readArchiveStrict();
      archive.push(...overflow);
      writeJSON(ARCHIVE_FILE, archive);
    } catch (err) {
      console.error(
        `Failed to archive audit log entries; ${ARCHIVE_FILE} left untouched and audit-log.json not trimmed:`,
        err
      );
      writeJSON("audit-log.json", entries);
      return;
    }
  }
  const trimmed = entries.slice(-MAX_AUDIT_ENTRIES);
  writeJSON("audit-log.json", trimmed);
}

module.exports = { appendAuditLog };
