const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const signature = require("cookie-signature");
const { readJSON, writeJSON } = require("./data");

const COOKIE_SECRET = process.env.COOKIE_SECRET || (() => {
  const fallback = crypto.randomBytes(32).toString("hex");
  console.warn("WARNING: COOKIE_SECRET not set. Sessions will not survive restarts. Set COOKIE_SECRET env var in production.");
  return fallback;
})();
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
const sessions = new Map();

/* ── Login rate limiting ── */
const loginAttempts = new Map(); // ip -> { count, resetTime }
const LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 10;

// Clean up expired login attempts every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts) {
    if (now > entry.resetTime) loginAttempts.delete(ip);
  }
}, 300000);

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, resetTime: now + LOGIN_WINDOW };
  if (now > entry.resetTime) { entry.count = 0; entry.resetTime = now + LOGIN_WINDOW; }
  entry.count++;
  loginAttempts.set(ip, entry);
  return entry.count <= MAX_LOGIN_ATTEMPTS;
}

/* ── Password reset rate limiting ── */
const resetAttempts = new Map(); // ip -> { count, resetTime }
const RESET_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_RESET_ATTEMPTS = 5;

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of resetAttempts) {
    if (now > entry.resetTime) resetAttempts.delete(ip);
  }
}, 300000);

function checkResetRateLimit(ip) {
  const now = Date.now();
  const entry = resetAttempts.get(ip) || { count: 0, resetTime: now + RESET_WINDOW };
  if (now > entry.resetTime) { entry.count = 0; entry.resetTime = now + RESET_WINDOW; }
  entry.count++;
  resetAttempts.set(ip, entry);
  return entry.count <= MAX_RESET_ATTEMPTS;
}

/* ── Multi-user seeding ── */

function seedAdminUsers() {
  const existing = readJSON("admin-users.json");
  if (existing && Array.isArray(existing) && existing.length > 0) return;

  // Migrate from legacy credentials.json if it exists
  const legacy = readJSON("credentials.json");
  if (legacy && legacy.username && legacy.passwordHash) {
    const user = {
      id: crypto.randomBytes(8).toString("hex"),
      username: legacy.username,
      email: "",
      displayName: legacy.username === "admin" ? "Admin" : legacy.username,
      passwordHash: legacy.passwordHash,
      isActive: true,
      role: "owner",
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    };
    writeJSON("admin-users.json", [user]);
    console.log(`Migrated legacy credentials to admin-users.json (user: ${user.username}, role: owner).`);
    return;
  }

  // Fresh seed — never seed a predictable default password
  const initialPassword =
    (process.env.INITIAL_ADMIN_PASSWORD || "").trim() ||
    crypto.randomBytes(16).toString("hex");
  const hash = bcrypt.hashSync(initialPassword, 10);
  const user = {
    id: crypto.randomBytes(8).toString("hex"),
    username: "admin",
    email: "",
    displayName: "Admin",
    passwordHash: hash,
    isActive: true,
    role: "owner",
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };
  writeJSON("admin-users.json", [user]);
  console.log("Admin user 'admin' seeded in admin-users.json. Set INITIAL_ADMIN_PASSWORD or reset via admin CLI.");
}

/* ── Login verification ── */

async function verifyLogin(username, password) {
  const users = readJSON("admin-users.json", []);
  const user = users.find((u) => u.username === username && u.isActive);
  if (!user) return null;
  try {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
  } catch (err) {
    console.error("bcrypt.compare error:", err);
    return null;
  }
  // Update lastLoginAt
  user.lastLoginAt = new Date().toISOString();
  try { writeJSON("admin-users.json", users); } catch (err) { console.error("Failed to update lastLoginAt:", err); }
  return user;
}

/* ── Session management ── */

function createSession(user) {
  const id = crypto.randomBytes(32).toString("hex");
  const csrf = crypto.randomBytes(24).toString("hex");
  sessions.set(id, {
    userId: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    csrf,
    createdAt: Date.now(),
  });
  return id;
}

function getSession(req) {
  const raw = parseCookies(req).session;
  if (!raw) return null;
  const id = signature.unsign(raw, COOKIE_SECRET);
  if (id === false) return null;
  const session = sessions.get(id);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL) {
    sessions.delete(id);
    return null;
  }
  // Sliding window: refresh session on activity
  session.createdAt = Date.now();
  return { id, ...session };
}

function destroySession(id) {
  sessions.delete(id);
}

function setSessionCookie(res, sessionId) {
  const signed = signature.sign(sessionId, COOKIE_SECRET);
  res.setHeader("Set-Cookie", `session=${signed}; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=86400${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `session=; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=0`);
}

/* ── Middleware ── */

function requireAuth(req, res, next) {
  const session = getSession(req);
  if (!session) {
    res.redirect("/admin/login");
    return;
  }
  req.session = session;
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session) {
      res.redirect("/admin/login");
      return;
    }
    if (req.session.role !== role) {
      res.status(403).send("Access denied. You do not have permission for this action. <a href='/admin'>Go back</a>");
      return;
    }
    next();
  };
}

function verifyCsrf(req, res, next) {
  const session = req.session;
  const token = req.body && req.body._csrf;
  if (!session || !token || token !== session.csrf) {
    res.status(403).send("Invalid or missing CSRF token. <a href='/admin'>Go back</a>");
    return;
  }
  next();
}

/* ── User CRUD helpers ── */

function getAllUsers() {
  return readJSON("admin-users.json", []);
}

function findUserById(id) {
  const users = readJSON("admin-users.json", []);
  return users.find((u) => u.id === id) || null;
}

function createUser({ username, email, displayName, password, role }) {
  const users = readJSON("admin-users.json", []);
  if (users.find((u) => u.username === username)) {
    throw new Error("Username already exists");
  }
  const user = {
    id: crypto.randomBytes(8).toString("hex"),
    username,
    email: email || "",
    displayName: displayName || username,
    passwordHash: bcrypt.hashSync(password, 10),
    isActive: true,
    role: role || "staff",
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };
  users.push(user);
  writeJSON("admin-users.json", users);
  return user;
}

function updateUser(id, updates) {
  const users = readJSON("admin-users.json", []);
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  const allowed = ["email", "displayName", "role"];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      users[idx][key] = updates[key];
    }
  }
  writeJSON("admin-users.json", users);
  return users[idx];
}

function deactivateUser(id) {
  const users = readJSON("admin-users.json", []);
  const user = users.find((u) => u.id === id);
  if (!user) return null;
  user.isActive = false;
  writeJSON("admin-users.json", users);
  return user;
}

function reactivateUser(id) {
  const users = readJSON("admin-users.json", []);
  const user = users.find((u) => u.id === id);
  if (!user) return null;
  user.isActive = true;
  writeJSON("admin-users.json", users);
  return user;
}

function changeUserPassword(id, newPassword) {
  const users = readJSON("admin-users.json", []);
  const user = users.find((u) => u.id === id);
  if (!user) return null;
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  writeJSON("admin-users.json", users);
  return user;
}

/* ── Password reset tokens ── */

const resetTokens = new Map(); // token -> { userId, expiresAt }
const RESET_TTL = 60 * 60 * 1000; // 1 hour

function createResetToken(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  resetTokens.set(token, { userId, expiresAt: Date.now() + RESET_TTL });
  return token;
}

function verifyResetToken(token) {
  const entry = resetTokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    resetTokens.delete(token);
    return null;
  }
  return entry.userId;
}

function consumeResetToken(token) {
  const userId = verifyResetToken(token);
  if (userId) resetTokens.delete(token);
  return userId;
}

function findUserByEmail(email) {
  const users = readJSON("admin-users.json", []);
  return users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
}

/* ── Cookie parsing ── */

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const cookies = {};
  header.split(";").forEach((pair) => {
    const [key, ...val] = pair.trim().split("=");
    if (key) cookies[key.trim()] = decodeURIComponent(val.join("="));
  });
  return cookies;
}

module.exports = {
  seedAdminUsers,
  seedCredentials: seedAdminUsers, // backward compat alias
  verifyLogin,
  createSession,
  getSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  requireRole,
  verifyCsrf,
  getAllUsers,
  findUserById,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  changeUserPassword,
  createResetToken,
  verifyResetToken,
  consumeResetToken,
  findUserByEmail,
  checkLoginRateLimit,
  checkResetRateLimit,
};
