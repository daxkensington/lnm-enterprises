const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { readJSON, writeJSON, dataDir } = require("./data");

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

  if (entries.length <= MAX_AUDIT_ENTRIES) {
    writeJSON("audit-log.json", entries);
    return;
  }

  const overflow = entries.slice(0, entries.length - MAX_AUDIT_ENTRIES);
  let archived = false;

  try {
    const archivePath = path.join(dataDir, "audit-log-archive.json");
    let archive = [];
    if (fs.existsSync(archivePath)) {
      const raw = fs.readFileSync(archivePath, "utf8");
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error("audit-log-archive.json does not contain an array");
      }
      archive = parsed;
    }

    const existingIds = new Set(archive.map((item) => item && item.id).filter(Boolean));
    for (const item of overflow) {
      if (!existingIds.has(item.id)) {
        archive.push(item);
        existingIds.add(item.id);
      }
    }

    writeJSON("audit-log-archive.json", archive);
    archived = true;
  } catch (err) {
    console.error("Failed to archive audit log entries:", err);
    writeJSON("audit-log.json", entries);
    return;
  }

  // Archive write succeeded; trim active log to MAX_AUDIT_ENTRIES.
  // Note: if writeJSON throws here, untrimmed entries remain in audit-log.json,
  // but existing archive IDs are deduplicated on subsequent retry.
  if (archived) {
    writeJSON("audit-log.json", entries.slice(-MAX_AUDIT_ENTRIES));
  }
}

module.exports = { appendAuditLog };
