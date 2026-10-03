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
  // Archive overflow entries before trimming; only trim the active log once
  // the archive write succeeds so no entries are silently dropped.
  let archived = true;
  if (entries.length > MAX_AUDIT_ENTRIES) {
    const overflow = entries.slice(0, entries.length - MAX_AUDIT_ENTRIES);
    archived = false;
    try {
      const archive = readJSON("audit-log-archive.json", []);
      archive.push(...overflow);
      writeJSON("audit-log-archive.json", archive);
      archived = true;
    } catch (err) {
      console.error("Failed to archive audit log entries:", err);
    }
  }
  const finalEntries = archived ? entries.slice(-MAX_AUDIT_ENTRIES) : entries;
  writeJSON("audit-log.json", finalEntries);
}

module.exports = { appendAuditLog };
