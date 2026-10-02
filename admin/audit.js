const crypto = require("crypto");
const { readJSON, writeJSON } = require("./data");

const MAX_AUDIT_ENTRIES = 500;

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
    oldValue: oldValue === null || oldValue === undefined ? null : JSON.stringify(oldValue),
    newValue: newValue === null || newValue === undefined ? null : JSON.stringify(newValue),
    ipAddress: req.ip || req.connection?.remoteAddress || null,
  });
  // Archive overflow entries before trimming
  if (entries.length > MAX_AUDIT_ENTRIES) {
    const overflow = entries.slice(0, entries.length - MAX_AUDIT_ENTRIES);
    try {
      const archive = readJSON("audit-log-archive.json", []);
      archive.push(...overflow);
      writeJSON("audit-log-archive.json", archive);
    } catch (err) {
      console.error("Failed to archive audit log entries:", err);
    }
  }
  const trimmed = entries.slice(-MAX_AUDIT_ENTRIES);
  writeJSON("audit-log.json", trimmed);
}

module.exports = { appendAuditLog };