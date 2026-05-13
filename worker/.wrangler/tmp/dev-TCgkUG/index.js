var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// .wrangler/tmp/bundle-uE7A4y/checked-fetch.js
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
var urls;
var init_checked_fetch = __esm({
  ".wrangler/tmp/bundle-uE7A4y/checked-fetch.js"() {
    "use strict";
    urls = /* @__PURE__ */ new Set();
    __name(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// .wrangler/tmp/bundle-uE7A4y/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
var init_strip_cf_connecting_ip_header = __esm({
  ".wrangler/tmp/bundle-uE7A4y/strip-cf-connecting-ip-header.js"() {
    "use strict";
    __name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        return Reflect.apply(target, thisArg, [
          stripCfConnectingIPHeader.apply(null, argArray)
        ]);
      }
    });
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// src/utils/jwt.ts
var jwt_exports = {};
__export(jwt_exports, {
  createJWT: () => createJWT,
  createRefreshToken: () => createRefreshToken,
  verifyJWT: () => verifyJWT
});
function base64url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4)
    str += "=";
  return atob(str);
}
async function createJWT(payload, secret) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(
    JSON.stringify({ ...payload, exp: Date.now() + ACCESS_TOKEN_TTL })
  );
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${header}.${body}`)
  );
  const sig = base64url(String.fromCharCode(...new Uint8Array(signature)));
  return `${header}.${body}.${sig}`;
}
async function createRefreshToken(payload, secret) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(
    JSON.stringify({ ...payload, type: "refresh", exp: Date.now() + REFRESH_TOKEN_TTL })
  );
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${header}.${body}`)
  );
  const sig = base64url(String.fromCharCode(...new Uint8Array(signature)));
  return `${header}.${body}.${sig}`;
}
async function verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split(".");
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(base64urlDecode(sig), (c) => c.charCodeAt(0)),
      encoder.encode(`${header}.${body}`)
    );
    if (!valid)
      return null;
    const payload = JSON.parse(base64urlDecode(body));
    if (payload.exp < Date.now())
      return null;
    return payload;
  } catch {
    return null;
  }
}
var ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL;
var init_jwt = __esm({
  "src/utils/jwt.ts"() {
    "use strict";
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    __name(base64url, "base64url");
    __name(base64urlDecode, "base64urlDecode");
    ACCESS_TOKEN_TTL = 15 * 60 * 1e3;
    __name(createJWT, "createJWT");
    REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 * 1e3;
    __name(createRefreshToken, "createRefreshToken");
    __name(verifyJWT, "verifyJWT");
  }
});

// .wrangler/tmp/bundle-uE7A4y/middleware-loader.entry.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// .wrangler/tmp/bundle-uE7A4y/middleware-insertion-facade.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/index.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/utils/response.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function corsHeaders(env, requestOrigin) {
  const allowedOrigins = [env.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"];
  let origin = allowedOrigins[0];
  if (requestOrigin) {
    if (allowedOrigins.includes(requestOrigin) || requestOrigin.startsWith("app://") || requestOrigin.startsWith("capacitor://") || requestOrigin.startsWith("http://127.0.0.1:")) {
      origin = requestOrigin;
    }
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Secret, x-device-id",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json"
  };
}
__name(corsHeaders, "corsHeaders");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}
__name(errorResponse, "errorResponse");

// src/index.ts
init_jwt();

// src/controllers/auth.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/utils/crypto.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function generateId() {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 16);
}
__name(generateId, "generateId");
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");

// src/controllers/auth.controller.ts
init_jwt();

// src/services/kv.service.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function getJSON(kv, key) {
  return kv.get(key, "json");
}
__name(getJSON, "getJSON");
async function putJSON(kv, key, data) {
  await kv.put(key, JSON.stringify(data));
}
__name(putJSON, "putJSON");

// src/constants/api.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
var GOOGLE_OAUTH_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
var GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
var RESEND_API_URL = "https://api.resend.com/emails";
var FREE_IP_API = "https://freeipapi.com/api/json";
var OPEN_METEO_FORECAST_API = "https://api.open-meteo.com/v1/forecast";
var OPEN_METEO_AQI_API = "https://air-quality-api.open-meteo.com/v1/air-quality";
var EXCHANGERATE_API = "https://api.exchangerate-api.com/v4/latest/USD";
var ENTRADE_CHART_API = "https://services.entrade.com.vn/chart-api/v2/ohlcs/stock";
var FMARKET_API_BASE = "https://api.fmarket.vn/res";

// src/controllers/auth.controller.ts
var DEFAULT_WALLETS = [
  { name: "Ng\xE2n h\xE0ng", balance: 0, currency: "VND", icon: "\u{1F3E6}", color: "#3b82f6", order: 0 },
  { name: "V\xED \u0111i\u1EC7n t\u1EED", balance: 0, currency: "VND", icon: "\u{1F4F1}", color: "#8b5cf6", order: 1 },
  { name: "Ti\u1EC1n m\u1EB7t", balance: 0, currency: "VND", icon: "\u{1F4B5}", color: "#10b981", order: 2 }
];
async function handleRegister(request, env) {
  const { email, password, name } = await request.json();
  if (!email || !password)
    return errorResponse("Email and password required");
  if (typeof password !== "string" || password.length < 6)
    return errorResponse("M\u1EADt kh\u1EA9u ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1");
  if (typeof email !== "string" || !email.includes("@"))
    return errorResponse("Email kh\xF4ng h\u1EE3p l\u1EC7");
  const usersIndex = await getJSON(env.SMART_NOTE_KV, "users/_index") || {};
  if (usersIndex[email])
    return errorResponse("Email already registered");
  const id = generateId();
  const user = {
    id,
    email,
    name: name || email.split("@")[0],
    passwordHash: await hashPassword(password),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await putJSON(env.SMART_NOTE_KV, `users/${id}/profile`, user);
  usersIndex[email] = id;
  await putJSON(env.SMART_NOTE_KV, "users/_index", usersIndex);
  await putJSON(env.SMART_NOTE_KV, `users/${id}/notes/_index`, { notes: [] });
  const defaultWallets = DEFAULT_WALLETS.map((w) => ({
    ...w,
    id: generateId()
  }));
  await putJSON(env.SMART_NOTE_KV, `users/${id}/finance/wallets`, defaultWallets);
  await putJSON(env.SMART_NOTE_KV, `users/${id}/finance/transactions`, []);
  const token = await createJWT({ userId: id }, env.JWT_SECRET);
  const refreshToken = await createRefreshToken({ userId: id }, env.JWT_SECRET);
  return jsonResponse({
    success: true,
    data: {
      token,
      refreshToken,
      user: {
        id,
        email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      }
    }
  });
}
__name(handleRegister, "handleRegister");
async function handleLogin(request, env) {
  const { email, password } = await request.json();
  if (!email || !password)
    return errorResponse("Email and password required");
  const usersIndex = await getJSON(env.SMART_NOTE_KV, "users/_index") || {};
  const userId = usersIndex[email];
  if (!userId)
    return errorResponse("Invalid credentials", 401);
  const user = await getJSON(env.SMART_NOTE_KV, `users/${userId}/profile`);
  if (!user)
    return errorResponse("User not found", 404);
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash)
    return errorResponse("Invalid credentials", 401);
  const token = await createJWT({ userId: user.id }, env.JWT_SECRET);
  const refreshToken = await createRefreshToken({ userId: user.id }, env.JWT_SECRET);
  return jsonResponse({
    success: true,
    data: {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      }
    }
  });
}
__name(handleLogin, "handleLogin");
async function handleUpdateProfile(userId, request, env) {
  const { name, avatarUrl, hasCompletedOnboarding, lastWeeklyEvent } = await request.json();
  const user = await getJSON(env.SMART_NOTE_KV, `users/${userId}/profile`);
  if (!user)
    return errorResponse("User not found", 404);
  if (name)
    user.name = name;
  if (avatarUrl !== void 0) {
    if (!avatarUrl || avatarUrl.trim() === "") {
      delete user.avatarUrl;
    } else {
      user.avatarUrl = avatarUrl.trim();
    }
  }
  if (hasCompletedOnboarding !== void 0) {
    user.hasCompletedOnboarding = hasCompletedOnboarding;
  }
  if (lastWeeklyEvent !== void 0) {
    user.lastWeeklyEvent = lastWeeklyEvent;
  }
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/profile`, user);
  return jsonResponse({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || "",
      createdAt: user.createdAt,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      lastWeeklyEvent: user.lastWeeklyEvent
    }
  });
}
__name(handleUpdateProfile, "handleUpdateProfile");
async function handleDeleteAccount(userId, request, env) {
  const { password } = await request.json();
  if (!password)
    return errorResponse("Password is required", 400);
  const user = await getJSON(env.SMART_NOTE_KV, `users/${userId}/profile`);
  if (!user)
    return errorResponse("User not found", 404);
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) {
    return errorResponse("M\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c", 400);
  }
  const usersIndex = await getJSON(env.SMART_NOTE_KV, "users/_index") || {};
  delete usersIndex[user.email];
  await putJSON(env.SMART_NOTE_KV, "users/_index", usersIndex);
  await env.SMART_NOTE_KV.delete(`users/${userId}/profile`);
  await env.SMART_NOTE_KV.delete(`users/${userId}/notes/_index`);
  await env.SMART_NOTE_KV.delete(`users/${userId}/finance/wallets`);
  await env.SMART_NOTE_KV.delete(`users/${userId}/finance/transactions`);
  await env.SMART_NOTE_KV.delete(`users/${userId}/pin`);
  await env.SMART_NOTE_KV.delete(`users/${userId}/otp`);
  return jsonResponse({ success: true, message: "Account deleted successfully" });
}
__name(handleDeleteAccount, "handleDeleteAccount");
async function handleGoogleOAuthUrl(request, env) {
  const { email, redirectUri } = await request.json();
  if (!email)
    return errorResponse("Email is required");
  if (!redirectUri)
    return errorResponse("Redirect URI is required");
  const usersIndex = await getJSON(env.SMART_NOTE_KV, "users/_index") || {};
  const userId = usersIndex[email];
  if (!userId)
    return errorResponse("Email kh\xF4ng t\u1ED3n t\u1EA1i trong h\u1EC7 th\u1ED1ng", 400);
  if (!env.GOOGLE_CLIENT_ID)
    return errorResponse("Google OAuth not configured", 503);
  const nonce = generateId() + generateId();
  const nonceHash = await hashPassword(nonce);
  await env.SMART_NOTE_KV.put(`oauth_nonce/${nonceHash}`, email, { expirationTtl: 600 });
  const state = btoa(JSON.stringify({ nonce, email }));
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "email profile",
    access_type: "online",
    state,
    prompt: "select_account",
    login_hint: email
  });
  const oauthUrl = `${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`;
  return jsonResponse({ success: true, data: { url: oauthUrl } });
}
__name(handleGoogleOAuthUrl, "handleGoogleOAuthUrl");
async function handleGoogleVerify(request, env) {
  const { code, state, redirectUri } = await request.json();
  if (!code || !state || !redirectUri)
    return errorResponse("Missing required fields");
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return errorResponse("Google OAuth not configured", 503);
  }
  let stateData;
  try {
    stateData = JSON.parse(atob(state));
  } catch {
    return errorResponse("Invalid state parameter", 400);
  }
  const nonceHash = await hashPassword(stateData.nonce);
  const storedEmail = await env.SMART_NOTE_KV.get(`oauth_nonce/${nonceHash}`);
  if (!storedEmail || storedEmail !== stateData.email) {
    return errorResponse("Phi\xEAn x\xE1c minh \u0111\xE3 h\u1EBFt h\u1EA1n ho\u1EB7c kh\xF4ng h\u1EE3p l\u1EC7. Vui l\xF2ng th\u1EED l\u1EA1i.", 400);
  }
  const tokenResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    }).toString()
  });
  if (!tokenResponse.ok)
    return errorResponse("X\xE1c minh Google th\u1EA5t b\u1EA1i. Vui l\xF2ng th\u1EED l\u1EA1i.", 400);
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  if (!accessToken)
    return errorResponse("No access token from Google", 400);
  const userInfoResponse = await fetch(GOOGLE_OAUTH_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!userInfoResponse.ok)
    return errorResponse("Kh\xF4ng th\u1EC3 l\u1EA5y th\xF4ng tin t\u1EEB Google", 400);
  const googleUser = await userInfoResponse.json();
  if (!googleUser.email || !googleUser.verified_email)
    return errorResponse("Email Google ch\u01B0a \u0111\u01B0\u1EE3c x\xE1c minh", 400);
  if (googleUser.email.toLowerCase() !== stateData.email.toLowerCase()) {
    return errorResponse("Email Google kh\xF4ng kh\u1EDBp v\u1EDBi email \u0111\u0103ng k\xFD. Vui l\xF2ng \u0111\u0103ng nh\u1EADp \u0111\xFAng t\xE0i kho\u1EA3n Google.", 400);
  }
  const usersIndex = await getJSON(env.SMART_NOTE_KV, "users/_index") || {};
  const userId = usersIndex[stateData.email];
  if (!userId)
    return errorResponse("User not found", 404);
  const resetToken = generateId() + generateId();
  const resetTokenHash = await hashPassword(resetToken);
  await env.SMART_NOTE_KV.put(`users/${userId}/otp/reset_token`, resetTokenHash, { expirationTtl: 900 });
  await env.SMART_NOTE_KV.delete(`oauth_nonce/${nonceHash}`);
  return jsonResponse({ success: true, data: { resetToken, email: stateData.email } });
}
__name(handleGoogleVerify, "handleGoogleVerify");
async function handleResetPassword(request, env) {
  const { email, resetToken, newPassword } = await request.json();
  if (!email || !resetToken || !newPassword)
    return errorResponse("Missing required fields");
  if (newPassword.length < 6)
    return errorResponse("M\u1EADt kh\u1EA9u ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1");
  const usersIndex = await getJSON(env.SMART_NOTE_KV, "users/_index") || {};
  const userId = usersIndex[email];
  if (!userId)
    return errorResponse("Y\xEAu c\u1EA7u kh\xF4ng h\u1EE3p l\u1EC7", 400);
  const storedTokenHash = await env.SMART_NOTE_KV.get(`users/${userId}/otp/reset_token`);
  if (!storedTokenHash)
    return errorResponse("Phi\xEAn \u0111\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u \u0111\xE3 h\u1EBFt h\u1EA1n. Vui l\xF2ng th\u1EED l\u1EA1i.", 400);
  const inputHash = await hashPassword(resetToken);
  if (inputHash !== storedTokenHash)
    return errorResponse("Reset token kh\xF4ng h\u1EE3p l\u1EC7", 400);
  const user = await getJSON(env.SMART_NOTE_KV, `users/${userId}/profile`);
  if (!user)
    return errorResponse("User not found", 404);
  user.passwordHash = await hashPassword(newPassword);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/profile`, user);
  await env.SMART_NOTE_KV.delete(`users/${userId}/otp/reset_token`);
  return jsonResponse({ success: true, message: "\u0110\u1EB7t l\u1EA1i m\u1EADt kh\u1EA9u th\xE0nh c\xF4ng" });
}
__name(handleResetPassword, "handleResetPassword");
async function handleGoogleSignIn(request, env) {
  const { code, redirectUri } = await request.json();
  if (!code || !redirectUri)
    return errorResponse("Missing required fields");
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
    return errorResponse("Google OAuth not configured", 503);
  const tokenResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    }).toString()
  });
  if (!tokenResponse.ok)
    return errorResponse("\u0110\u0103ng nh\u1EADp Google th\u1EA5t b\u1EA1i. Vui l\xF2ng th\u1EED l\u1EA1i.", 400);
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  if (!accessToken)
    return errorResponse("No access token from Google", 400);
  const userInfoResponse = await fetch(GOOGLE_OAUTH_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!userInfoResponse.ok)
    return errorResponse("Kh\xF4ng th\u1EC3 l\u1EA5y th\xF4ng tin t\u1EEB Google", 400);
  const googleUser = await userInfoResponse.json();
  if (!googleUser.email || !googleUser.verified_email)
    return errorResponse("Email Google ch\u01B0a \u0111\u01B0\u1EE3c x\xE1c minh", 400);
  const email = googleUser.email.toLowerCase();
  const usersIndex = await getJSON(env.SMART_NOTE_KV, "users/_index") || {};
  let userId = usersIndex[email];
  let isNewUser = false;
  if (userId) {
    const user = await getJSON(env.SMART_NOTE_KV, `users/${userId}/profile`);
    if (!user)
      return errorResponse("User not found", 404);
    if (googleUser.picture && user.avatarUrl !== googleUser.picture) {
      user.avatarUrl = googleUser.picture;
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/profile`, user);
    }
    const token = await createJWT({ userId: user.id }, env.JWT_SECRET);
    const refreshToken = await createRefreshToken({ userId: user.id }, env.JWT_SECRET);
    return jsonResponse({
      success: true,
      data: {
        token,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, createdAt: user.createdAt, hasCompletedOnboarding: user.hasCompletedOnboarding },
        isNewUser: false
      }
    });
  } else {
    isNewUser = true;
    userId = generateId();
    const randomPass = generateId() + generateId() + generateId();
    const user = {
      id: userId,
      email,
      name: googleUser.name || email.split("@")[0],
      avatarUrl: googleUser.picture,
      passwordHash: await hashPassword(randomPass),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/profile`, user);
    usersIndex[email] = userId;
    await putJSON(env.SMART_NOTE_KV, "users/_index", usersIndex);
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/_index`, { notes: [] });
    const defaultWallets = DEFAULT_WALLETS.map((w) => ({ ...w, id: generateId() }));
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, defaultWallets);
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, []);
    const token = await createJWT({ userId }, env.JWT_SECRET);
    const refreshToken = await createRefreshToken({ userId }, env.JWT_SECRET);
    return jsonResponse({
      success: true,
      data: {
        token,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, createdAt: user.createdAt, hasCompletedOnboarding: user.hasCompletedOnboarding },
        isNewUser: true
      }
    });
  }
}
__name(handleGoogleSignIn, "handleGoogleSignIn");
async function handleForgotPin(userId, request, env) {
  const { password } = await request.json();
  if (!password)
    return errorResponse("Vui l\xF2ng nh\u1EADp m\u1EADt kh\u1EA9u", 400);
  const user = await getJSON(env.SMART_NOTE_KV, `users/${userId}/profile`);
  if (!user)
    return errorResponse("User not found", 404);
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash)
    return errorResponse("M\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c", 400);
  const resetToken = generateId() + generateId();
  const resetTokenHash = await hashPassword(resetToken);
  await env.SMART_NOTE_KV.put(`users/${userId}/otp/pin_reset_token`, resetTokenHash, { expirationTtl: 300 });
  return jsonResponse({ success: true, data: { resetToken } });
}
__name(handleForgotPin, "handleForgotPin");
async function handleResetPin(userId, request, env) {
  const { resetToken, newPin } = await request.json();
  if (!resetToken || !newPin)
    return errorResponse("Missing required fields");
  if (!newPin || newPin.length !== 4 || !/^\d+$/.test(newPin))
    return errorResponse("PIN ph\u1EA3i l\xE0 4 ch\u1EEF s\u1ED1");
  const storedTokenHash = await env.SMART_NOTE_KV.get(`users/${userId}/otp/pin_reset_token`);
  if (!storedTokenHash)
    return errorResponse("Phi\xEAn \u0111\u1EB7t l\u1EA1i PIN \u0111\xE3 h\u1EBFt h\u1EA1n. Vui l\xF2ng th\u1EED l\u1EA1i.", 400);
  const inputHash = await hashPassword(resetToken);
  if (inputHash !== storedTokenHash)
    return errorResponse("Reset token kh\xF4ng h\u1EE3p l\u1EC7", 400);
  const pinHash = await hashPassword(newPin);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/pin`, pinHash);
  await env.SMART_NOTE_KV.delete(`users/${userId}/otp/pin_reset_token`);
  return jsonResponse({ success: true, message: "\u0110\u1EB7t l\u1EA1i PIN th\xE0nh c\xF4ng" });
}
__name(handleResetPin, "handleResetPin");
async function handleRefreshToken(request, env) {
  const { refreshToken } = await request.json();
  if (!refreshToken)
    return errorResponse("Refresh token is required", 400);
  const payload = await verifyJWT(refreshToken, env.JWT_SECRET);
  if (!payload || payload.type !== "refresh") {
    return errorResponse("Invalid or expired refresh token", 401);
  }
  const user = await getJSON(env.SMART_NOTE_KV, `users/${payload.userId}/profile`);
  if (!user)
    return errorResponse("User not found", 401);
  const newToken = await createJWT({ userId: payload.userId }, env.JWT_SECRET);
  const newRefreshToken = await createRefreshToken({ userId: payload.userId }, env.JWT_SECRET);
  return jsonResponse({
    success: true,
    data: {
      token: newToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      }
    }
  });
}
__name(handleRefreshToken, "handleRefreshToken");

// src/controllers/webhook.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/controllers/push.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/webcrypto-web-push/dist/lib/main.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/webcrypto-web-push/dist/lib/encrypt.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/webcrypto-web-push/dist/lib/client-keys.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/base64.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/base64-arraybuffer/dist/base64-arraybuffer.es5.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
for (i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}
var i;
var encode = /* @__PURE__ */ __name(function(arraybuffer) {
  var bytes = new Uint8Array(arraybuffer), i, len = bytes.length, base64 = "";
  for (i = 0; i < len; i += 3) {
    base64 += chars[bytes[i] >> 2];
    base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
    base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
    base64 += chars[bytes[i + 2] & 63];
  }
  if (len % 3 === 2) {
    base64 = base64.substring(0, base64.length - 1) + "=";
  } else if (len % 3 === 1) {
    base64 = base64.substring(0, base64.length - 2) + "==";
  }
  return base64;
}, "encode");
var decode = /* @__PURE__ */ __name(function(base64) {
  var bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
  if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }
  var arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
  for (i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = encoded1 << 2 | encoded2 >> 4;
    bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
    bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
  }
  return arraybuffer;
}, "decode");

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/base64.js
function decodeBase64Url(str) {
  return decode(str.replace(/-/g, "+").replace(/_/g, "/"));
}
__name(decodeBase64Url, "decodeBase64Url");
function encodeBase64Url(arr) {
  return encode(arr).replace(/\//g, "_").replace(/\+/g, "-").replace(/=+$/, "");
}
__name(encodeBase64Url, "encodeBase64Url");
function objectToBase64Url(obj) {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(obj)));
}
__name(objectToBase64Url, "objectToBase64Url");

// node_modules/@block65/webcrypto-web-push/dist/lib/isomorphic-crypto.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var impl = globalThis.crypto ? globalThis.crypto : await import("node:crypto");
var crypto2 = {
  getRandomValues: (array) => "webcrypto" in impl ? impl.webcrypto.getRandomValues(array) : impl.getRandomValues(array),
  subtle: "webcrypto" in impl ? impl.webcrypto.subtle : impl.subtle
};
var CryptoKey2 = "webcrypto" in impl ? impl.webcrypto.CryptoKey : globalThis.CryptoKey;

// node_modules/@block65/webcrypto-web-push/dist/lib/client-keys.js
async function deriveClientKeys(sub) {
  const publicBytes = decodeBase64Url(sub.keys.p256dh);
  const publicJwk = {
    kty: "EC",
    crv: "P-256",
    x: encodeBase64Url(publicBytes.slice(1, 33)),
    y: encodeBase64Url(publicBytes.slice(33, 65)),
    ext: true
  };
  return {
    publicBytes: new Uint8Array(publicBytes),
    publicKey: await crypto2.subtle.importKey("jwk", publicJwk, {
      name: "ECDH",
      namedCurve: "P-256"
    }, true, []),
    authSecretBytes: decodeBase64Url(sub.keys.auth)
  };
}
__name(deriveClientKeys, "deriveClientKeys");

// node_modules/@block65/webcrypto-web-push/dist/lib/hkdf.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function createHMAC(data) {
  if (data.byteLength === 0) {
    return {
      hash: () => Promise.resolve(new ArrayBuffer(32))
    };
  }
  const keyPromise = crypto2.subtle.importKey("raw", data, {
    name: "HMAC",
    hash: "SHA-256"
  }, true, ["sign"]);
  return {
    hash: async (input) => {
      const k = await keyPromise;
      return crypto2.subtle.sign("HMAC", k, input);
    }
  };
}
__name(createHMAC, "createHMAC");
async function hkdf(salt, ikm) {
  const prkhPromise = createHMAC(salt).hash(ikm).then((prk) => createHMAC(prk));
  return {
    extract: async (info, len) => {
      const input = new Uint8Array([
        ...new Uint8Array(info),
        ...new Uint8Array([1])
      ]);
      const prkh = await prkhPromise;
      const hash = await prkh.hash(input);
      return hash.slice(0, len);
    }
  };
}
__name(hkdf, "hkdf");

// node_modules/@block65/webcrypto-web-push/dist/lib/info.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/webcrypto-web-push/dist/lib/utils.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function flattenUint8Array(arrays) {
  const flatNumberArray = arrays.reduce((accum, arr) => {
    accum.push(...arr);
    return accum;
  }, []);
  return new Uint8Array(flatNumberArray);
}
__name(flattenUint8Array, "flattenUint8Array");
function be16(val) {
  return (val & 255) << 8 | val >> 8 & 255;
}
__name(be16, "be16");
function arrayChunk(arr, chunkSize) {
  const chunks = [];
  const arrayLength = arr.length;
  let i = 0;
  while (i < arrayLength) {
    chunks.push(arr.slice(i, i += chunkSize));
  }
  return chunks;
}
__name(arrayChunk, "arrayChunk");
function generateNonce(base, index) {
  const nonce = base.slice(0, 12);
  for (let i = 0; i < 6; ++i) {
    nonce[nonce.length - 1 - i] ^= index / 256 ** i & 255;
  }
  return nonce;
}
__name(generateNonce, "generateNonce");
function encodeLength(int) {
  return new Uint8Array([0, int]);
}
__name(encodeLength, "encodeLength");
function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
__name(invariant, "invariant");

// node_modules/@block65/webcrypto-web-push/dist/lib/info.js
function createInfo(clientPublic, serverPublic, type) {
  return new Uint8Array([
    ...new TextEncoder().encode(`Content-Encoding: ${type}\0`),
    ...new TextEncoder().encode("P-256\0"),
    ...encodeLength(clientPublic.byteLength),
    ...clientPublic,
    ...encodeLength(serverPublic.byteLength),
    ...serverPublic
  ]);
}
__name(createInfo, "createInfo");
function createInfo2(type) {
  return new Uint8Array([
    ...new TextEncoder().encode(`Content-Encoding: ${type}\0`)
    // ...new TextEncoder().encode('P-256\0'),
    // ...encodeInt(clientPublic.byteLength),
    // ...clientPublic,
    // ...encodeInt(serverPublic.byteLength),
    // ...serverPublic,
  ]);
}
__name(createInfo2, "createInfo2");

// node_modules/@block65/webcrypto-web-push/dist/lib/jwk-to-bytes.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function ecJwkToBytes(jwk) {
  invariant(jwk.x, "jwk.x is missing");
  invariant(jwk.y, "jwk.y is missing");
  const xBytes = new Uint8Array(decodeBase64Url(jwk.x));
  const yBytes = new Uint8Array(decodeBase64Url(jwk.y));
  const raw = [4, ...xBytes, ...yBytes];
  return new Uint8Array(raw);
}
__name(ecJwkToBytes, "ecJwkToBytes");

// node_modules/@block65/webcrypto-web-push/dist/lib/local-keys.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function generateLocalKeys() {
  const keyPair = await crypto2.subtle.generateKey({
    name: "ECDH",
    namedCurve: "P-256"
  }, true, ["deriveBits"]);
  const publicJwk = await crypto2.subtle.exportKey("jwk", keyPair.publicKey);
  const privateJwk = await crypto2.subtle.exportKey("jwk", keyPair.privateKey);
  return {
    publicKey: await crypto2.subtle.importKey("jwk", publicJwk, { name: "ECDH", namedCurve: "P-256" }, true, []),
    privateKey: keyPair.privateKey,
    publicJwk,
    privateJwk
  };
}
__name(generateLocalKeys, "generateLocalKeys");

// node_modules/@block65/webcrypto-web-push/dist/lib/salt.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function getSalt() {
  return crypto2.getRandomValues(new Uint8Array(16));
}
__name(getSalt, "getSalt");

// node_modules/@block65/webcrypto-web-push/dist/lib/encrypt.js
async function encryptNotification(subscription, plaintext) {
  const clientKeys = await deriveClientKeys(subscription);
  const salt = await getSalt();
  const localKeys = await generateLocalKeys();
  const localPublicKeyBytes = ecJwkToBytes(localKeys.publicJwk);
  const sharedSecret = await crypto2.subtle.deriveBits({
    name: "ECDH",
    // namedCurve: 'P-256',
    public: clientKeys.publicKey
  }, localKeys.privateKey, 256);
  const cekInfo = createInfo(clientKeys.publicBytes, localPublicKeyBytes, "aesgcm");
  const nonceInfo = createInfo(clientKeys.publicBytes, localPublicKeyBytes, "nonce");
  const keyInfo = createInfo2("auth");
  const ikmHkdf = await hkdf(clientKeys.authSecretBytes, sharedSecret);
  const ikm = await ikmHkdf.extract(keyInfo, 32);
  const messageHkdf = await hkdf(salt, ikm);
  const cekBytes = await messageHkdf.extract(cekInfo, 16);
  const nonceBytes = await messageHkdf.extract(nonceInfo, 12);
  const cekCryptoKey = await crypto2.subtle.importKey("raw", cekBytes, {
    name: "AES-GCM",
    length: 128
  }, false, ["encrypt"]);
  const cipherChunks = await Promise.all(arrayChunk(plaintext, 4095).map(async (chunk, idx) => {
    const padSize = 0;
    const x = new Uint16Array([be16(padSize)]);
    const padded = new Uint8Array([
      ...new Uint8Array(x.buffer, x.byteOffset, x.byteLength),
      ...chunk
    ]);
    const encrypted = await crypto2.subtle.encrypt({
      name: "AES-GCM",
      iv: generateNonce(new Uint8Array(nonceBytes), idx)
    }, cekCryptoKey, padded);
    return new Uint8Array(encrypted);
  }));
  return {
    ciphertext: flattenUint8Array(cipherChunks),
    salt,
    localPublicKeyBytes
  };
}
__name(encryptNotification, "encryptNotification");

// node_modules/@block65/webcrypto-web-push/dist/lib/vapid.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/main.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/sign.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/jwt-algorithms.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var algorithms = {
  ES256: { name: "ECDSA", namedCurve: "P-256", hash: { name: "SHA-256" } },
  ES384: { name: "ECDSA", namedCurve: "P-384", hash: { name: "SHA-384" } },
  ES512: { name: "ECDSA", namedCurve: "P-521", hash: { name: "SHA-512" } },
  HS256: { name: "HMAC", hash: { name: "SHA-256" } },
  HS384: { name: "HMAC", hash: { name: "SHA-384" } },
  HS512: { name: "HMAC", hash: { name: "SHA-512" } },
  RS256: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } },
  RS384: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-384" } },
  RS512: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-512" } }
};

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/sign.js
async function sign(payload, key, options) {
  if (payload === null || typeof payload !== "object") {
    throw new Error("payload must be an object");
  }
  if (!(key instanceof CryptoKey2)) {
    throw new Error("key must be a CryptoKey");
  }
  if (typeof options.algorithm !== "string") {
    throw new Error("options.algorithm must be a string");
  }
  const headerStr = objectToBase64Url({
    typ: "JWT",
    alg: options.algorithm,
    ...options.kid && { kid: options.kid }
  });
  const payloadStr = objectToBase64Url({
    iat: Math.floor(Date.now() / 1e3),
    ...payload
  });
  const dataStr = `${headerStr}.${payloadStr}`;
  const signature = await crypto2.subtle.sign(algorithms[options.algorithm], key, new TextEncoder().encode(dataStr));
  return `${dataStr}.${encodeBase64Url(signature)}`;
}
__name(sign, "sign");

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/verify.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/decode.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/errors.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/custom-error/dist/lib/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/custom-error/dist/lib/custom-error.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var Status;
(function(Status2) {
  Status2[Status2["OK"] = 0] = "OK";
  Status2[Status2["CANCELLED"] = 1] = "CANCELLED";
  Status2[Status2["UNKNOWN"] = 2] = "UNKNOWN";
  Status2[Status2["INVALID_ARGUMENT"] = 3] = "INVALID_ARGUMENT";
  Status2[Status2["DEADLINE_EXCEEDED"] = 4] = "DEADLINE_EXCEEDED";
  Status2[Status2["NOT_FOUND"] = 5] = "NOT_FOUND";
  Status2[Status2["ALREADY_EXISTS"] = 6] = "ALREADY_EXISTS";
  Status2[Status2["PERMISSION_DENIED"] = 7] = "PERMISSION_DENIED";
  Status2[Status2["RESOURCE_EXHAUSTED"] = 8] = "RESOURCE_EXHAUSTED";
  Status2[Status2["FAILED_PRECONDITION"] = 9] = "FAILED_PRECONDITION";
  Status2[Status2["ABORTED"] = 10] = "ABORTED";
  Status2[Status2["OUT_OF_RANGE"] = 11] = "OUT_OF_RANGE";
  Status2[Status2["UNIMPLEMENTED"] = 12] = "UNIMPLEMENTED";
  Status2[Status2["INTERNAL"] = 13] = "INTERNAL";
  Status2[Status2["UNAVAILABLE"] = 14] = "UNAVAILABLE";
  Status2[Status2["DATA_LOSS"] = 15] = "DATA_LOSS";
  Status2[Status2["UNAUTHENTICATED"] = 16] = "UNAUTHENTICATED";
})(Status || (Status = {}));
var CUSTOM_ERROR_SYM = Symbol.for("CustomError");
var defaultHttpMapping = /* @__PURE__ */ new Map([
  [Status.OK, 200],
  [Status.INVALID_ARGUMENT, 400],
  [Status.FAILED_PRECONDITION, 400],
  [Status.OUT_OF_RANGE, 400],
  [Status.UNAUTHENTICATED, 401],
  [Status.PERMISSION_DENIED, 403],
  [Status.NOT_FOUND, 404],
  [Status.ABORTED, 409],
  [Status.ALREADY_EXISTS, 409],
  [Status.RESOURCE_EXHAUSTED, 403],
  [Status.CANCELLED, 499],
  [Status.DATA_LOSS, 500],
  [Status.UNKNOWN, 500],
  [Status.INTERNAL, 500],
  [Status.UNIMPLEMENTED, 501],
  // [Code.LOCAL_OUTAGE,  502],
  [Status.UNAVAILABLE, 503],
  [Status.DEADLINE_EXCEEDED, 504]
]);
function withNullProto(obj) {
  return Object.assign(/* @__PURE__ */ Object.create(null), obj);
}
__name(withNullProto, "withNullProto");
var CustomError = class extends Error {
  /**
   * The previous error that occurred, useful if "wrapping" an error to hide
   * sensitive details
   * @type {Error | CustomError | unknown}
   */
  cause;
  /**
   * Further error details suitable for end user consumption
   * @type {ErrorDetail[]}
   */
  details;
  /**
   * Status code suitable to coarsely determine the reason for error
   * @type {Status}
   */
  code = Status.UNKNOWN;
  /**
   * Contains arbitrary debug data for developer troubleshooting
   * @type {DebugData}
   * @private
   */
  debugData;
  /**
   *
   * @param {string} message Developer facing message, in English.
   * @param {Error | CustomError | unknown} cause
   */
  constructor(message, cause) {
    super(message, { cause });
    this.cause = cause;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
  static isCustomError(value) {
    return !!value && typeof value === "object" && CUSTOM_ERROR_SYM in value;
  }
  debug(data) {
    if (arguments.length > 0) {
      this.debugData = withNullProto({
        ...this.debugData,
        ...data
      });
      return this;
    }
    return this.debugData;
  }
  /**
   * Human readable representation of the error code
   * @return {keyof typeof Status}
   */
  get status() {
    return Status[this.code];
  }
  /**
   * Adds further error details suitable for end user consumption
   * @param {ErrorDetail} details
   * @return {this}
   */
  addDetail(...details) {
    this.details = (this.details || []).concat(details);
    return this;
  }
  /**
   * A "safe" serialised version of the error designed for end user consumption
   * @return {CustomErrorSerialized}
   */
  serialize() {
    const localised = this.details?.find((detail) => "locale" in detail);
    return withNullProto({
      message: this.message,
      ...localised?.message && {
        message: localised.message
      },
      code: this.code,
      status: this.status,
      ...this.details && { details: this.details }
    });
  }
  /**
   * JSON representation of the error object.
   *
   * Use {serialize} instead if you need to send this error over the wire
   *
   * @return {object}
   */
  toJSON() {
    const debug = this.debug();
    return withNullProto({
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      ...this.details && { details: this.details },
      ...this.cause instanceof Error && {
        cause: "toJSON" in this.cause && typeof this.cause.toJSON === "function" ? this.cause.toJSON() : {
          message: this.cause.message,
          name: "Error"
        }
      },
      ...this.stack && { stack: this.stack },
      ...debug && { debug }
    });
  }
  /**
   * "Hydrates" a previously serialised error object
   * @param {CustomErrorSerialized} params
   * @return {CustomError}
   */
  static fromJSON(params) {
    const { code = Status.UNKNOWN, message, details = [] } = params;
    const err = new CustomError(message || (Status[params.code] || params.code || "Error").toString()).debug({ params });
    err.code = code;
    if (details) {
      err.addDetail(...details);
    }
    return err;
  }
  /**
   * An automatically determined HTTP status code
   * @return {number}
   */
  static suggestHttpResponseCode(err) {
    const code = CustomError.isCustomError(err) ? err.code : Status.UNKNOWN;
    return defaultHttpMapping.get(code) || 500;
  }
};
__name(CustomError, "CustomError");
Object.defineProperty(CustomError.prototype, CUSTOM_ERROR_SYM, {
  value: true,
  enumerable: false,
  writable: false
});
Object.defineProperty(CustomError.prototype, "status", {
  enumerable: true
});

// node_modules/@block65/custom-error/dist/lib/serialize.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/verify-jwks.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/assert.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// node_modules/@block65/webcrypto-web-push/dist/lib/vapid.js
async function vapidHeaders(subscription, vapid) {
  invariant(vapid.subject, "Vapid subject is empty");
  invariant(vapid.privateKey, "Vapid private key is empty");
  invariant(vapid.publicKey, "Vapid public key is empty");
  const vapidPublicKeyBytes = decodeBase64Url(vapid.publicKey);
  const publicKey = await crypto2.subtle.importKey("jwk", {
    kty: "EC",
    crv: "P-256",
    x: encodeBase64Url(vapidPublicKeyBytes.slice(1, 33)),
    y: encodeBase64Url(vapidPublicKeyBytes.slice(33, 65)),
    d: vapid.privateKey
  }, {
    name: "ECDSA",
    namedCurve: "P-256"
  }, false, ["sign"]);
  const jwt = await sign({
    aud: new URL(subscription.endpoint).origin,
    exp: Math.floor(Date.now() / 1e3) + 12 * 60 * 60,
    sub: vapid.subject
  }, publicKey, {
    algorithm: "ES256"
  });
  return {
    headers: {
      authorization: `WebPush ${jwt}`,
      "crypto-key": `p256ecdsa=${vapid.publicKey}`
    }
    // publicJwk,
  };
}
__name(vapidHeaders, "vapidHeaders");

// node_modules/@block65/webcrypto-web-push/dist/lib/payload.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function buildPushPayload(message, subscription, vapid) {
  const { headers } = await vapidHeaders(subscription, vapid);
  const encrypted = await encryptNotification(subscription, new TextEncoder().encode(
    // if its a primitive, convert to string, otherwise stringify
    typeof message.data === "string" || typeof message.data === "number" ? message.data.toString() : JSON.stringify(message.data)
  ));
  return {
    headers: {
      ...headers,
      "crypto-key": `dh=${encodeBase64Url(encrypted.localPublicKeyBytes)};${headers["crypto-key"]}`,
      encryption: `salt=${encodeBase64Url(encrypted.salt)}`,
      ttl: (message.options?.ttl || 60).toString(),
      ...message.options?.urgency && {
        urgency: message.options.urgency
      },
      ...message.options?.topic && {
        topic: message.options.topic
      },
      "content-encoding": "aesgcm",
      "content-length": encrypted.ciphertext.byteLength.toString(),
      "content-type": "application/octet-stream"
    },
    method: "post",
    body: encrypted.ciphertext
  };
}
__name(buildPushPayload, "buildPushPayload");

// src/controllers/push.controller.ts
async function handlePushSubscribe(userId, request, env) {
  const body = await request.json();
  const { endpoint, keys } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return errorResponse("Invalid push subscription data");
  }
  const subs = await getJSON(env.SMART_NOTE_KV, `users/${userId}/push_subscriptions`) || [];
  const exists = subs.some((s) => s.endpoint === endpoint);
  if (!exists) {
    subs.push({
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/push_subscriptions`, subs);
  }
  return jsonResponse({ success: true, message: "Push subscription saved" });
}
__name(handlePushSubscribe, "handlePushSubscribe");
async function handlePushUnsubscribe(userId, request, env) {
  const { endpoint } = await request.json();
  if (!endpoint)
    return errorResponse("Endpoint is required");
  const subs = await getJSON(env.SMART_NOTE_KV, `users/${userId}/push_subscriptions`) || [];
  const filtered = subs.filter((s) => s.endpoint !== endpoint);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/push_subscriptions`, filtered);
  return jsonResponse({ success: true, message: "Push subscription removed" });
}
__name(handlePushUnsubscribe, "handlePushUnsubscribe");
async function handlePushTest(userId, request, env) {
  const body = await request.json();
  const title = body.title || "FinNote";
  const text = body.body || "B\u1EA1n c\xF3 th\xF4ng b\xE1o m\u1EDBi";
  const notiList = await getJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`) || [];
  const unreadCount = notiList.filter((n) => !n.read).length;
  await sendPushToUser(userId, env, { title, body: text, url: "/", unreadCount });
  return jsonResponse({ success: true, message: "Push notification sent" });
}
__name(handlePushTest, "handlePushTest");
async function sendPushToUser(userId, env, payload) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY)
    return;
  const subs = await getJSON(env.SMART_NOTE_KV, `users/${userId}/push_subscriptions`) || [];
  if (subs.length === 0)
    return;
  const vapid = {
    subject: "mailto:admin@finnote.app",
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY
  };
  const expiredEndpoints = [];
  const message = {
    data: JSON.stringify(payload),
    options: { ttl: 60 * 60 }
    // 1 hour TTL
  };
  for (const sub of subs) {
    try {
      const pushPayload = await buildPushPayload(
        message,
        { endpoint: sub.endpoint, expirationTime: null, keys: sub.keys },
        vapid
      );
      const fetchInit = {
        ...pushPayload,
        body: pushPayload.body instanceof Uint8Array ? pushPayload.body.buffer : pushPayload.body
      };
      const res = await fetch(sub.endpoint, fetchInit);
      if (res.status === 404 || res.status === 410) {
        expiredEndpoints.push(sub.endpoint);
      }
    } catch (err) {
      console.error(`[PUSH] Failed to send to ${sub.endpoint}:`, err);
    }
  }
  if (expiredEndpoints.length > 0) {
    const remaining = subs.filter((s) => !expiredEndpoints.includes(s.endpoint));
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/push_subscriptions`, remaining);
  }
}
__name(sendPushToUser, "sendPushToUser");

// src/controllers/webhook.controller.ts
async function handleTelegramWebhook(request, env) {
  const secret = request.headers.get("X-Webhook-Secret");
  if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return errorResponse("Unauthorized webhook", 401);
  }
  const body = await request.json();
  const { userId, type, amount, category, note, wallet } = body;
  if (!userId || !amount || !type) {
    return errorResponse("Missing required fields: userId, amount, type");
  }
  const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
  let walletId = wallets[0]?.id || "";
  if (wallet) {
    const found = wallets.find((w) => w.name.toLowerCase().includes(wallet.toLowerCase()));
    if (found)
      walletId = found.id;
  }
  const txs = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/finance/transactions`
  ) || [];
  const tx = {
    id: generateId(),
    type,
    amount: Math.abs(amount),
    category: category || (type === "expense" ? "other_expense" : "other_income"),
    note: note || "",
    walletId,
    source: "telegram",
    date: (/* @__PURE__ */ new Date()).toISOString().substring(0, 10),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  txs.push(tx);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs);
  const walletIdx = wallets.findIndex((w) => w.id === walletId);
  if (walletIdx !== -1) {
    wallets[walletIdx].balance += tx.type === "income" ? tx.amount : -tx.amount;
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets);
  }
  return jsonResponse({
    success: true,
    data: tx,
    message: `\u0110\xE3 ghi ${tx.type === "income" ? "thu" : "chi"} ${tx.amount.toLocaleString("vi-VN")}\u0111 v\xE0o ${wallets[walletIdx]?.name || "v\xED"}`
  });
}
__name(handleTelegramWebhook, "handleTelegramWebhook");
function parseAmount(text) {
  const match = text.match(/([\d.,]+)\s*(?:VND|đ|d|vnd)/i);
  if (!match)
    return 0;
  return parseInt(match[1].replace(/[.,]/g, ""), 10) || 0;
}
__name(parseAmount, "parseAmount");
function parseNotification(appName, text) {
  const lowerApp = appName.toLowerCase();
  const lowerText = text.toLowerCase();
  let walletHint = "";
  if (lowerApp.includes("vietcombank") || lowerApp.includes("vcb") || lowerText.includes("vietcombank"))
    walletHint = "Vietcombank";
  else if (lowerApp.includes("techcombank") || lowerApp.includes("tcb") || lowerText.includes("techcombank"))
    walletHint = "Techcombank";
  else if (lowerApp.includes("mbbank") || lowerApp.includes("mb bank") || lowerText.includes("mbbank"))
    walletHint = "MBBank";
  else if (lowerApp.includes("tpbank") || lowerApp.includes("tpb") || lowerText.includes("tpbank"))
    walletHint = "TPBank";
  else if (lowerApp.includes("momo") || lowerText.includes("momo"))
    walletHint = "MoMo";
  else if (lowerApp.includes("zalopay") || lowerApp.includes("zalo pay") || lowerText.includes("zalopay"))
    walletHint = "ZaloPay";
  else if (lowerApp.includes("bidv") || lowerText.includes("bidv"))
    walletHint = "BIDV";
  else if (lowerApp.includes("agribank") || lowerText.includes("agribank"))
    walletHint = "Agribank";
  else if (lowerApp.includes("vietinbank") || lowerText.includes("vietinbank"))
    walletHint = "VietinBank";
  else if (lowerApp.includes("acb") || lowerText.includes("acb"))
    walletHint = "ACB";
  const amount = parseAmount(text);
  if (amount <= 0)
    return null;
  let type = "expense";
  const incomeKeywords = ["ghi c\xF3", "ghi co", "nh\u1EADn", "nhan", "nh\u1EADn \u0111\u01B0\u1EE3c", "+", "credited", "received", "c\u1ED9ng"];
  const expenseKeywords = ["ghi n\u1EE3", "ghi no", "thanh to\xE1n", "thanh toan", "tr\u1EEB", "tru", "-", "debited", "chi", "chuy\u1EC3n", "chuyen"];
  if (incomeKeywords.some((k) => lowerText.includes(k)))
    type = "income";
  if (expenseKeywords.some((k) => lowerText.includes(k)))
    type = "expense";
  const signMatch = text.match(/([+-])\s*[\d.,]+\s*(?:VND|đ|d)/i);
  if (signMatch) {
    type = signMatch[1] === "+" ? "income" : "expense";
  }
  let note = "";
  const ndMatch = text.match(/(?:ND|Noi dung|Ref|nội dung)[:\s]+(.*?)(?:\.|$)/i);
  if (ndMatch)
    note = ndMatch[1].trim();
  return { type, amount, walletHint, note };
}
__name(parseNotification, "parseNotification");
async function handleNotificationWebhook(request, env) {
  const secret = request.headers.get("X-Webhook-Secret");
  if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return errorResponse("Unauthorized webhook", 401);
  }
  const body = await request.json();
  const { userId, appName, text, title } = body;
  if (!userId || !text) {
    return errorResponse("Missing required fields: userId, text");
  }
  const fullText = title ? `${title} ${text}` : text;
  const parsed = parseNotification(appName || "", fullText);
  if (!parsed) {
    const pending = await getJSON(
      env.SMART_NOTE_KV,
      `users/${userId}/finance/pending`
    ) || [];
    pending.push({
      id: generateId(),
      rawText: fullText,
      appName: appName || "Unknown",
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/pending`, pending);
    return jsonResponse({
      success: false,
      error: "Kh\xF4ng th\u1EC3 detect giao d\u1ECBch, \u0111\xE3 l\u01B0u v\xE0o pending",
      data: { rawText: fullText, status: "pending" }
    });
  }
  const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
  let walletId = wallets[0]?.id || "";
  if (parsed.walletHint) {
    const found = wallets.find((w) => w.name.toLowerCase().includes(parsed.walletHint.toLowerCase()));
    if (found)
      walletId = found.id;
  }
  const txs = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/finance/transactions`
  ) || [];
  const tx = {
    id: generateId(),
    type: parsed.type,
    amount: parsed.amount,
    category: parsed.type === "expense" ? "bank_transfer" : "bank_receive",
    note: parsed.note || `Auto: ${appName || "notification"}`,
    walletId,
    source: "notification",
    date: (/* @__PURE__ */ new Date()).toISOString().substring(0, 10),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  txs.push(tx);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs);
  const walletIdx = wallets.findIndex((w) => w.id === walletId);
  if (walletIdx !== -1) {
    wallets[walletIdx].balance += tx.type === "income" ? tx.amount : -tx.amount;
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets);
  }
  const walletName = wallets.find((w) => w.id === walletId)?.name || "v\xED";
  const notiList = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/notifications`
  ) || [];
  notiList.unshift({
    id: generateId(),
    type: parsed.type === "income" ? "bank_in" : "bank_out",
    title: `[Notification] ${parsed.type === "income" ? "Ti\u1EC1n v\xE0o t\xE0i kho\u1EA3n" : "Ti\u1EC1n ra t\xE0i kho\u1EA3n"}`,
    body: `${parsed.type === "income" ? "+" : "-"}${parsed.amount.toLocaleString("vi-VN")}\u0111 \u2022 Ghi v\xE0o v\xED: ${walletName}`,
    read: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    meta: { amount: parsed.amount, txType: parsed.type, walletName, bankName: parsed.walletHint || appName || "" }
  });
  if (notiList.length > 100)
    notiList.splice(100);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`, notiList);
  try {
    const pushTitle = parsed.type === "income" ? "\u{1F4B0} Ti\u1EC1n v\xE0o t\xE0i kho\u1EA3n" : "\u{1F4B8} Ti\u1EC1n ra t\xE0i kho\u1EA3n";
    const pushBody = `${parsed.type === "income" ? "+" : "-"}${parsed.amount.toLocaleString("vi-VN")}\u0111 \u2022 ${walletName}`;
    const unreadCount = notiList.filter((n) => !n.read).length;
    await sendPushToUser(userId, env, { title: pushTitle, body: pushBody, tag: `tx-${tx.id}`, url: "/", unreadCount });
  } catch {
  }
  return jsonResponse({
    success: true,
    data: tx,
    message: `[Notification] ${tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString("vi-VN")}\u0111 \u2192 Ghi v\xE0o v\xED: ${walletName}`
  });
}
__name(handleNotificationWebhook, "handleNotificationWebhook");

// src/controllers/notification.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function handleListNotifications(userId, env) {
  const notifications = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/notifications`
  ) || [];
  notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return jsonResponse({ success: true, data: notifications });
}
__name(handleListNotifications, "handleListNotifications");
async function handleMarkNotificationRead(userId, notiId, env) {
  const notifications = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/notifications`
  ) || [];
  const idx = notifications.findIndex((n) => n.id === notiId);
  if (idx !== -1) {
    notifications[idx].read = true;
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`, notifications);
  }
  return jsonResponse({ success: true });
}
__name(handleMarkNotificationRead, "handleMarkNotificationRead");
async function handleMarkAllNotificationsRead(userId, env) {
  const notifications = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/notifications`
  ) || [];
  notifications.forEach((n) => n.read = true);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`, notifications);
  return jsonResponse({ success: true });
}
__name(handleMarkAllNotificationsRead, "handleMarkAllNotificationsRead");
async function handleClearNotifications(userId, env) {
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`, []);
  return jsonResponse({ success: true });
}
__name(handleClearNotifications, "handleClearNotifications");
function parseSmsTransaction(text, senderHint = "") {
  if (!text)
    return null;
  let bankName = "";
  const lowerText = text.toLowerCase();
  if (lowerText.includes("tpbank") || lowerText.includes("(tpbank)"))
    bankName = "TPBank";
  else if (lowerText.includes("techcombank") || lowerText.includes("tcb"))
    bankName = "Techcombank";
  else if (lowerText.includes("vietcombank") || lowerText.includes("vcb"))
    bankName = "Vietcombank";
  else if (lowerText.includes("mbbank") || lowerText.includes("mb bank"))
    bankName = "MBBank";
  else if (lowerText.includes("bidv"))
    bankName = "BIDV";
  else if (lowerText.includes("agribank"))
    bankName = "Agribank";
  else if (lowerText.includes("vietinbank"))
    bankName = "VietinBank";
  else if (lowerText.includes("acb"))
    bankName = "ACB";
  else if (lowerText.includes("vpbank"))
    bankName = "VPBank";
  else if (lowerText.includes("sacombank"))
    bankName = "Sacombank";
  else if (lowerText.includes("vib"))
    bankName = "VIB";
  else if (lowerText.includes("ocb"))
    bankName = "OCB";
  else if (lowerText.includes("scb"))
    bankName = "SCB";
  else if (lowerText.includes("hdbank") || lowerText.includes("hd bank"))
    bankName = "HDBank";
  else if (lowerText.includes("shb"))
    bankName = "SHB";
  else if (lowerText.includes("eximbank"))
    bankName = "Eximbank";
  else if (lowerText.includes("lpbank") || lowerText.includes("lienviet"))
    bankName = "LPBank";
  else if (lowerText.includes("seabank"))
    bankName = "SeABank";
  else if (lowerText.includes("momo"))
    bankName = "MoMo";
  else if (lowerText.includes("zalopay"))
    bankName = "ZaloPay";
  if (!bankName && senderHint) {
    const lowerHint = senderHint.toLowerCase();
    if (lowerHint.includes("tpbank"))
      bankName = "TPBank";
    else if (lowerHint.includes("techcombank") || lowerHint.includes("tcb"))
      bankName = "Techcombank";
    else if (lowerHint.includes("vietcombank") || lowerHint.includes("vcb"))
      bankName = "Vietcombank";
    else if (lowerHint.includes("mbbank") || lowerHint.includes("mb"))
      bankName = "MBBank";
    else if (lowerHint.includes("bidv"))
      bankName = "BIDV";
    else if (lowerHint.includes("agribank"))
      bankName = "Agribank";
    else if (lowerHint.includes("vietinbank"))
      bankName = "VietinBank";
    else if (lowerHint.includes("acb"))
      bankName = "ACB";
    else if (lowerHint.includes("vpbank"))
      bankName = "VPBank";
    else if (lowerHint.includes("sacombank"))
      bankName = "Sacombank";
    else if (lowerHint.includes("vib"))
      bankName = "VIB";
    else if (lowerHint.includes("ocb"))
      bankName = "OCB";
    else if (lowerHint.includes("scb"))
      bankName = "SCB";
    else if (lowerHint.includes("hdbank") || lowerHint.includes("hd bank"))
      bankName = "HDBank";
    else if (lowerHint.includes("shb"))
      bankName = "SHB";
    else if (lowerHint.includes("eximbank"))
      bankName = "Eximbank";
    else if (lowerHint.includes("lpbank") || lowerHint.includes("lienviet"))
      bankName = "LPBank";
    else if (lowerHint.includes("seabank"))
      bankName = "SeABank";
    else if (lowerHint.includes("momo"))
      bankName = "MoMo";
    else if (lowerHint.includes("zalopay"))
      bankName = "ZaloPay";
    if (!bankName)
      bankName = senderHint;
  }
  if (!bankName) {
    const bankRegex = /\b([a-zA-Z]+bank)\b/i;
    const match = text.match(bankRegex) || senderHint.match(bankRegex);
    if (match) {
      bankName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    }
  }
  const psMatch = text.match(/(?:PS|Phat sinh|So tien)[^:]*:\s*([+-])?\s*([\d.,]+)\s*(?:VND|đ|d)/i);
  const tkMatch = text.match(/(?:TK|Tai khoan|Account)[^:]*:\s*([A-Za-z0-9*x]+)/i);
  const sdMatch = text.match(/(?:SD|So du)(?:\s*cuoi[^:]*|\s*hien tai[^:]*)?\s*:\s*([+-]?[\d.,]+)\s*(?:VND|đ|d)/i);
  const ndMatch = text.match(/(?:ND|Noi dung|Noi dung GD|Desc)[^:]*:\s*([^\n\r]+)/i);
  const soGdMatch = text.match(/(?:SO GD|Ma GD|Ref|Trace|Ma giao dich)[^:]*:\s*([A-Za-z0-9]+)/i);
  let type = "expense";
  let amount = 0;
  let note = "";
  let txRef = "";
  let account = "";
  let balance = 0;
  if (psMatch) {
    type = psMatch[1] === "+" || !psMatch[1] ? "income" : "expense";
    if (psMatch[1] === "-")
      type = "expense";
    amount = parseInt(psMatch[2].replace(/[.,]/g, ""), 10) || 0;
  }
  if (amount <= 0) {
    const genericMatch = text.match(/([+-])\s*([\d.,]+)\s*(?:VND|đ)/i);
    if (genericMatch) {
      type = genericMatch[1] === "+" ? "income" : "expense";
      amount = parseInt(genericMatch[2].replace(/[.,]/g, ""), 10) || 0;
    }
  }
  if (amount <= 0) {
    const truMatch = text.match(/(?:bi tru|ghi no|ghi nợ|trừ|thanh toan|thanh toán|chi|chuyen|chuyển|giao dich|gd)\s*([\d.,]+)\s*(?:VND|đ|d)/i);
    if (truMatch) {
      type = "expense";
      amount = parseInt(truMatch[1].replace(/[.,]/g, ""), 10) || 0;
    }
    const congMatch = text.match(/(?:duoc cong|ghi co|ghi có|cộng|nhận|nhan|nap|nạp)\s*([\d.,]+)\s*(?:VND|đ|d)/i);
    if (congMatch) {
      type = "income";
      amount = parseInt(congMatch[1].replace(/[.,]/g, ""), 10) || 0;
    }
  }
  if (amount <= 0) {
    const allMatches = [...text.matchAll(/([\d.,]+)\s*(?:VND|đ|d)/gi)];
    for (const match of allMatches) {
      const index = match.index || 0;
      const precedingText = text.substring(Math.max(0, index - 20), index).toLowerCase();
      if (!precedingText.includes("sd") && !precedingText.includes("so du") && !precedingText.includes("d\u01B0") && !precedingText.includes("kha dung")) {
        amount = parseInt(match[1].replace(/[.,]/g, ""), 10) || 0;
        if (amount > 0)
          break;
      }
    }
    if (amount > 0) {
      const isIncome = /(?:nhan|nhận|cộng|cong|thu|vao|vào|hoan tien|\+)/i.test(text);
      const isExpense = /(?:tru|trừ|chi|thanh toan|chuyen|rut|ra|mua|phi|phi gd|lixi|\-)/i.test(text);
      if (isIncome && !isExpense)
        type = "income";
      else if (isExpense && !isIncome)
        type = "expense";
      else
        type = "expense";
    }
  }
  if (amount <= 0)
    return null;
  if (tkMatch)
    account = tkMatch[1].trim();
  if (sdMatch)
    balance = parseInt(sdMatch[1].replace(/[.,]/g, ""), 10) || 0;
  if (ndMatch)
    note = ndMatch[1].trim();
  if (soGdMatch)
    txRef = soGdMatch[1].trim();
  if (!note) {
    const ndFallback = text.match(/(?:Noi dung|nội dung|Ref)[:\s]+(.+?)(?:\.|$)/im);
    if (ndFallback)
      note = ndFallback[1].trim();
  }
  if (!note) {
    note = text.substring(0, 80) + (text.length > 80 ? "..." : "");
  }
  return {
    type,
    amount,
    note,
    txRef,
    account,
    balance,
    bankName,
    rawText: text.substring(0, 200) + (text.length > 200 ? "..." : "")
  };
}
__name(parseSmsTransaction, "parseSmsTransaction");
async function updateWebhookStatus(userId, env, updateData) {
  const latest = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/latest_request`) || {};
  const merged = { ...latest, ...updateData };
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/latest_request`, merged);
  const history = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/request_history`) || [];
  if (history.length > 0) {
    history[0] = { ...history[0], ...updateData };
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/request_history`, history);
  }
}
__name(updateWebhookStatus, "updateWebhookStatus");
async function handleSmsWebhook(request, env) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const secret = request.headers.get("X-Webhook-Secret") || url.searchParams.get("secret");
  if (env.TELEGRAM_WEBHOOK_SECRET && secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    if (!userId) {
      return errorResponse("Unauthorized webhook. Vui l\xF2ng th\xEAm &secret=... v\xE0o URL", 401);
    }
  }
  const contentType = request.headers.get("content-type") || "";
  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return errorResponse("Failed to read request body");
  }
  if (userId) {
    const logEntry = {
      contentType,
      rawDump: rawBody.substring(0, 2e3),
      // cap at 2KB
      headers: Object.fromEntries([...request.headers]),
      time: (/* @__PURE__ */ new Date()).toISOString(),
      status: "received"
      // will be overwritten to 'success' or 'pending' later
    };
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/latest_request`, logEntry);
    const history = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/request_history`) || [];
    history.unshift(logEntry);
    if (history.length > 20)
      history.splice(20);
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/request_history`, history);
  }
  let items = [];
  try {
    if (contentType.includes("application/json")) {
      const body = JSON.parse(rawBody);
      if (Array.isArray(body)) {
        items = body.map((item) => {
          const raw = item?.text ?? item?.message ?? item?.body ?? item?.content ?? item?.sms ?? "";
          const text = typeof raw === "string" ? raw : raw?.body ?? raw?.content ?? raw?.text ?? JSON.stringify(raw);
          const senderHint = (item?.sender ?? item?.from ?? item?.bank ?? "").toString().trim();
          return { text, senderHint };
        });
      } else {
        let raw = body?.text ?? body?.message ?? body?.body ?? body?.content ?? body?.sms ?? "";
        if (!raw && body?.amount) {
          const amt = body.amount.toString().replace(/[^\d]/g, "");
          const mrc = body.merchant || "Apple Pay";
          raw = `PS: -${amt} VND ND: ${mrc} (Apple Pay)`;
        }
        const text = typeof raw === "string" ? raw : raw?.body ?? raw?.content ?? raw?.text ?? JSON.stringify(raw);
        const senderHint = (body?.sender ?? body?.from ?? body?.bank ?? body?.wallet ?? "").toString().trim();
        items.push({ text, senderHint });
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(rawBody);
      const text = (params.get("text") || params.get("message") || params.get("body") || params.get("sms") || "").toString();
      items.push({ text, senderHint: "" });
    } else {
      let parsedBody = rawBody;
      try {
        const body = JSON.parse(rawBody);
        if (Array.isArray(body)) {
          items = body.map((item) => {
            const raw = item?.text ?? item?.message ?? item?.body ?? item?.content ?? item?.sms ?? "";
            const text = typeof raw === "string" ? raw : raw?.body ?? raw?.content ?? raw?.text ?? JSON.stringify(raw);
            const senderHint = (item?.sender ?? item?.from ?? item?.bank ?? "").toString().trim();
            return { text, senderHint };
          });
        } else {
          const raw = body?.text ?? body?.message ?? body?.body ?? body?.content ?? body?.sms ?? "";
          parsedBody = typeof raw === "string" && raw.length > 0 ? raw : rawBody;
          items.push({ text: parsedBody, senderHint: "" });
        }
      } catch {
        items.push({ text: parsedBody, senderHint: "" });
      }
    }
  } catch (err) {
    return errorResponse("Invalid webhook payload");
  }
  items = items.map((i) => ({ text: i.text.trim(), senderHint: i.senderHint })).filter((i) => i.text);
  if (items.length === 0) {
    const time = (/* @__PURE__ */ new Date()).toISOString();
    items.push({
      text: `TK 123456 GD: +50,000VND ${time} SD: 1,000,000VND ND: TEST IPHONE BANG NUT PLAY`,
      senderHint: "TPBank"
    });
  }
  if (!userId)
    return errorResponse("Missing userId query param");
  const user = await getJSON(env.SMART_NOTE_KV, `users/${userId}/profile`);
  if (!user)
    return errorResponse("User not found", 404);
  const results = [];
  let hasSuccess = false;
  let lastResponse = null;
  for (const item of items) {
    const text = item.text;
    const senderHint = item.senderHint;
    const parsed = parseSmsTransaction(text, senderHint);
    if (!parsed) {
      const notiParsed = parseNotification("SMS", text);
      if (notiParsed) {
        const fallbackParsed = {
          type: notiParsed.type,
          amount: notiParsed.amount,
          note: notiParsed.note || text.substring(0, 80),
          txRef: "",
          account: "",
          balance: 0,
          bankName: notiParsed.walletHint || senderHint || "",
          rawText: text.substring(0, 200)
        };
        lastResponse = await processSmsTransaction(fallbackParsed, text, userId, env);
        results.push({ status: "success (fallback)", text: text.substring(0, 50) });
        hasSuccess = true;
        continue;
      }
      const pending = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/pending`) || [];
      pending.push({
        id: generateId(),
        rawText: text,
        appName: "SMS",
        status: "pending",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/pending`, pending);
      results.push({ status: "pending", text: text.substring(0, 50), error: "Kh\xF4ng th\u1EC3 nh\u1EADn di\u1EC7n c\xFA ph\xE1p giao d\u1ECBch t\u1EEB SMS" });
      continue;
    }
    lastResponse = await processSmsTransaction(parsed, text, userId, env);
    results.push({ status: "success", text: text.substring(0, 50) });
    hasSuccess = true;
  }
  if (items.length > 1 || !hasSuccess) {
    await updateWebhookStatus(userId, env, {
      status: hasSuccess ? "success" : "pending",
      error: hasSuccess ? void 0 : "Kh\xF4ng th\u1EC3 nh\u1EADn di\u1EC7n c\xFA ph\xE1p t\u1EEB SMS n\xE0o",
      rawDump: `Processed ${items.length} items. Results:
${JSON.stringify(results, null, 2)}

Original Payload:
${rawBody.substring(0, 1e3)}`
    }).catch(() => {
    });
  }
  if (items.length === 1 && lastResponse && hasSuccess) {
    return lastResponse;
  }
  return jsonResponse({
    success: true,
    message: `\u0110\xE3 x\u1EED l\xFD xong ${items.length} tin nh\u1EAFn`,
    results
  });
}
__name(handleSmsWebhook, "handleSmsWebhook");
async function processSmsTransaction(parsed, originalText, userId, env) {
  const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
  const txs = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`) || [];
  let walletId = wallets[0]?.id || "";
  if (parsed.bankName) {
    const found = wallets.find((w) => w.name.toLowerCase().includes(parsed.bankName.toLowerCase()));
    if (found) {
      walletId = found.id;
    } else {
      const BANK_ALIAS_MAP = {
        "Techcombank": ["techcombank", "tcb"],
        "TPBank": ["tpbank", "tpb", "tp bank"],
        "MBBank": ["mbbank", "mb bank", "mb", "qu\xE2n \u0111\u1ED9i"],
        "Vietcombank": ["vietcombank", "vcb"],
        "BIDV": ["bidv"],
        "Agribank": ["agribank", "agr"],
        "VietinBank": ["vietinbank", "viettin", "ctg"],
        "ACB": ["acb"],
        "VPBank": ["vpbank", "vp bank"],
        "SHBank": ["shbank", "sh bank"],
        "MSB": ["msb", "maritime"],
        "MoMo": ["momo"],
        "ZaloPay": ["zalopay", "zalo pay"]
      };
      for (const [walletKey, aliases] of Object.entries(BANK_ALIAS_MAP)) {
        if (aliases.some((a) => parsed.bankName.toLowerCase().includes(a))) {
          const w = wallets.find((w2) => w2.name.toLowerCase().includes(walletKey.toLowerCase()));
          if (w) {
            walletId = w.id;
            break;
          }
        }
      }
    }
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
  const smsHash = parsed.txRef ? `[ref:${parsed.txRef}]` : `[sms:${parsed.type}_${parsed.amount}_${today}_${parsed.bankName || "unknown"}_${Date.now().toString(36)}]`;
  let noteContent = parsed.note || parsed.rawText.substring(0, 80);
  let extraInfo = "";
  if (parsed.account)
    extraInfo += ` \u2022 TK: ${parsed.account}`;
  if (parsed.balance)
    extraInfo += ` \u2022 SD: ${parsed.balance.toLocaleString("vi-VN")}\u0111`;
  if (parsed.txRef)
    extraInfo += ` \u2022 GD: ${parsed.txRef}`;
  const bankLabel = parsed.bankName ? ` \u2022 ${parsed.bankName}` : "";
  const tx = {
    id: generateId(),
    type: parsed.type,
    amount: parsed.amount,
    category: parsed.type === "income" ? "bank_receive" : "bank_transfer",
    note: `${noteContent}${extraInfo}${bankLabel} ${smsHash}`.trim(),
    walletId,
    source: "sms",
    date: (/* @__PURE__ */ new Date()).toISOString().substring(0, 10),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  txs.push(tx);
  const walletIdx = wallets.findIndex((w) => w.id === walletId);
  if (walletIdx !== -1) {
    if (parsed.balance && parsed.balance > 0) {
      wallets[walletIdx].balance = parsed.balance;
    } else {
      wallets[walletIdx].balance += parsed.type === "income" ? parsed.amount : -parsed.amount;
    }
  }
  const walletName = wallets.find((w) => w.id === walletId)?.name || "v\xED";
  const notiList = await getJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`) || [];
  notiList.unshift({
    id: generateId(),
    type: parsed.type === "income" ? "bank_in" : "bank_out",
    title: `[SMS] ${parsed.type === "income" ? "Ti\u1EC1n v\xE0o t\xE0i kho\u1EA3n" : "Ti\u1EC1n ra t\xE0i kho\u1EA3n"}`,
    body: `${parsed.type === "income" ? "+" : "-"}${parsed.amount.toLocaleString("vi-VN")}\u0111 \u2022 Ghi v\xE0o v\xED: ${walletName}`,
    read: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    meta: { amount: parsed.amount, txType: parsed.type, walletName, bankName: parsed.bankName || "SMS" }
  });
  if (notiList.length > 100)
    notiList.splice(100);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`, notiList);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets);
  try {
    const pushTitle = parsed.type === "income" ? "\u{1F4B0} Ti\u1EC1n v\xE0o t\xE0i kho\u1EA3n" : "\u{1F4B8} Ti\u1EC1n ra t\xE0i kho\u1EA3n";
    const pushBody = `${parsed.type === "income" ? "+" : "-"}${parsed.amount.toLocaleString("vi-VN")}\u0111 \u2022 ${walletName}`;
    const unreadCount = notiList.filter((n) => !n.read).length;
    await sendPushToUser(userId, env, { title: pushTitle, body: pushBody, tag: `sms-${tx.id}`, url: "/", unreadCount });
  } catch {
  }
  await updateWebhookStatus(userId, env, {
    status: "success",
    transactionId: tx.id,
    parsedData: {
      type: parsed.type,
      amount: parsed.amount,
      note: parsed.note,
      bankName: parsed.bankName,
      walletName,
      walletId,
      txRef: parsed.txRef,
      balance: parsed.balance,
      account: parsed.account
    }
  }).catch(() => {
  });
  return jsonResponse({
    success: true,
    message: `${parsed.type === "income" ? "+" : "-"}${parsed.amount.toLocaleString("vi-VN")}\u0111 \u2192 ${walletName}`,
    data: {
      transactionId: tx.id,
      type: parsed.type,
      amount: parsed.amount,
      note: parsed.note,
      bankName: parsed.bankName,
      walletName,
      txRef: parsed.txRef,
      balance: parsed.balance || void 0
    }
  });
}
__name(processSmsTransaction, "processSmsTransaction");

// src/controllers/note.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function handleListNotes(userId, env) {
  const index = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/_index`
  );
  return jsonResponse({ success: true, data: index?.notes || [] });
}
__name(handleListNotes, "handleListNotes");
async function handleGetNote(userId, noteId, env) {
  const note = await getJSON(env.SMART_NOTE_KV, `users/${userId}/notes/${noteId}`);
  if (!note)
    return errorResponse("Note not found", 404);
  return jsonResponse({ success: true, data: note });
}
__name(handleGetNote, "handleGetNote");
async function handleCreateNote(userId, request, env) {
  const body = await request.json();
  const id = generateId();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const note = {
    id,
    title: body.title || "Untitled",
    content: body.content || "",
    tags: body.tags || [],
    pinned: body.pinned || false,
    createdAt: now,
    updatedAt: now
  };
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/${id}`, note);
  const index = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/_index`
  ) || { notes: [] };
  index.notes.push({
    id: note.id,
    title: note.title,
    excerpt: note.content.substring(0, 120),
    tags: note.tags,
    pinned: note.pinned,
    updatedAt: note.updatedAt
  });
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/_index`, index);
  return jsonResponse({ success: true, data: note }, 201);
}
__name(handleCreateNote, "handleCreateNote");
async function handleUpdateNote(userId, noteId, request, env) {
  const existing = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/${noteId}`
  );
  if (!existing)
    return errorResponse("Note not found", 404);
  const body = await request.json();
  const updated = {
    ...existing,
    title: body.title !== void 0 ? body.title : existing.title,
    content: body.content !== void 0 ? body.content : existing.content,
    tags: Array.isArray(body.tags) ? body.tags : existing.tags,
    pinned: typeof body.pinned === "boolean" ? body.pinned : existing.pinned,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/${noteId}`, updated);
  const index = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/_index`
  ) || { notes: [] };
  const idx = index.notes.findIndex((n) => n.id === noteId);
  if (idx !== -1) {
    index.notes[idx] = {
      id: updated.id,
      title: updated.title,
      excerpt: updated.content.substring(0, 120),
      tags: updated.tags,
      pinned: updated.pinned,
      updatedAt: updated.updatedAt
    };
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/_index`, index);
  }
  return jsonResponse({ success: true, data: updated });
}
__name(handleUpdateNote, "handleUpdateNote");
async function handleDeleteNote(userId, noteId, env) {
  await env.SMART_NOTE_KV.delete(`users/${userId}/notes/${noteId}`);
  const index = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/_index`
  ) || { notes: [] };
  index.notes = index.notes.filter((n) => n.id !== noteId);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/_index`, index);
  return jsonResponse({ success: true });
}
__name(handleDeleteNote, "handleDeleteNote");
async function handleUpdateNoteShare(userId, noteId, request, env) {
  const existing = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/notes/${noteId}`
  );
  if (!existing)
    return errorResponse("Note not found", 404);
  const body = await request.json();
  const isPublic = !!body.isPublic;
  const sharedWith = Array.isArray(body.sharedWith) ? body.sharedWith : [];
  const updated = {
    ...existing,
    isPublic,
    sharedWith,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/notes/${noteId}`, updated);
  if (isPublic || sharedWith.length > 0) {
    await putJSON(env.SMART_NOTE_KV, `shared_notes/${noteId}`, { ownerId: userId, isPublic, sharedWith });
  } else {
    await env.SMART_NOTE_KV.delete(`shared_notes/${noteId}`);
  }
  return jsonResponse({ success: true, data: updated });
}
__name(handleUpdateNoteShare, "handleUpdateNoteShare");
async function handleGetSharedNote(noteId, request, env) {
  const shareMeta = await getJSON(
    env.SMART_NOTE_KV,
    `shared_notes/${noteId}`
  );
  if (!shareMeta)
    return errorResponse("Shared note not found", 404);
  if (!shareMeta.isPublic) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return errorResponse("Unauthorized. Login required.", 401);
    const token = authHeader.substring(7);
    const { verifyJWT: verifyJWT2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
    const payload = await verifyJWT2(token, env.JWT_SECRET);
    if (!payload)
      return errorResponse("Invalid token", 401);
    const user = await getJSON(env.SMART_NOTE_KV, `users/${payload.userId}/profile`);
    if (!user || !shareMeta.sharedWith.includes(user.email)) {
      return errorResponse("Forbidden: You do not have access to this note", 403);
    }
  }
  const note = await getJSON(env.SMART_NOTE_KV, `users/${shareMeta.ownerId}/notes/${noteId}`);
  if (!note)
    return errorResponse("Note not found", 404);
  return jsonResponse({ success: true, data: note });
}
__name(handleGetSharedNote, "handleGetSharedNote");

// src/controllers/finance.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function handleListWallets(userId, env) {
  const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
  return jsonResponse({ success: true, data: wallets });
}
__name(handleListWallets, "handleListWallets");
async function handleCreateWallet(userId, request, env) {
  const body = await request.json();
  const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
  const wallet = {
    id: generateId(),
    name: body.name,
    balance: body.balance || 0,
    currency: body.currency || "VND",
    icon: body.icon || "\u{1F4B0}",
    color: body.color || "#10b981",
    order: wallets.length,
    customLogoUrl: typeof body.customLogoUrl === "string" ? body.customLogoUrl.substring(0, 5e3) : void 0
  };
  wallets.push(wallet);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets);
  return jsonResponse({ success: true, data: wallet }, 201);
}
__name(handleCreateWallet, "handleCreateWallet");
async function handleUpdateWallet(userId, walletId, request, env) {
  const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
  const idx = wallets.findIndex((w) => w.id === walletId);
  if (idx === -1)
    return errorResponse("Wallet not found", 404);
  const body = await request.json();
  if (body.name !== void 0)
    wallets[idx].name = body.name;
  if (body.currency !== void 0)
    wallets[idx].currency = body.currency;
  if (body.icon !== void 0)
    wallets[idx].icon = body.icon;
  if (body.color !== void 0)
    wallets[idx].color = body.color;
  if (typeof body.order === "number")
    wallets[idx].order = body.order;
  if (typeof body.balance === "number")
    wallets[idx].balance = body.balance;
  if (body.customLogoUrl !== void 0)
    wallets[idx].customLogoUrl = typeof body.customLogoUrl === "string" ? body.customLogoUrl.substring(0, 5e3) : void 0;
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets);
  return jsonResponse({ success: true, data: wallets[idx] });
}
__name(handleUpdateWallet, "handleUpdateWallet");
async function handleDeleteWallet(userId, walletId, env) {
  const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
  const filtered = wallets.filter((w) => w.id !== walletId);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, filtered);
  return jsonResponse({ success: true });
}
__name(handleDeleteWallet, "handleDeleteWallet");
async function handleListTransactions(userId, request, env) {
  const txs = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/finance/transactions`
  ) || [];
  const url = new URL(request.url);
  const pageStr = url.searchParams.get("page");
  const limitStr = url.searchParams.get("limit");
  const typeFilter = url.searchParams.get("type");
  const walletIdFilter = url.searchParams.get("walletId");
  let filtered = txs;
  if (typeFilter && typeFilter !== "all") {
    filtered = filtered.filter((t) => t.type === typeFilter);
  }
  if (walletIdFilter) {
    filtered = filtered.filter((t) => t.walletId === walletIdFilter);
  }
  filtered.sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0)
      return dateDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  if (pageStr && limitStr) {
    const page = parseInt(pageStr, 10) || 1;
    const limit = parseInt(limitStr, 10) || 15;
    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);
    return jsonResponse({
      success: true,
      data: paginated,
      total,
      page,
      limit
    });
  }
  return jsonResponse({ success: true, data: filtered });
}
__name(handleListTransactions, "handleListTransactions");
async function handleGetFinanceStats(userId, request, env) {
  const txs = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`) || [];
  const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
  const url = new URL(request.url);
  let month = url.searchParams.get("month");
  if (!month) {
    const d = /* @__PURE__ */ new Date();
    month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  const monthTransactions = txs.filter((t) => t.date.startsWith(month));
  const monthIncome = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const weeklyStats = [];
  for (let i = 6; i >= 0; i--) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().substring(0, 10);
    const dayTx = txs.filter((t) => t.date === dateStr);
    const income = dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    weeklyStats.push({
      date: dateStr,
      income,
      expense,
      net: income - expense
    });
  }
  const expenseMap = {};
  let totalExpense = 0;
  monthTransactions.filter((t) => t.type === "expense").forEach((t) => {
    expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
    totalExpense += t.amount;
  });
  const expenseByCategory = Object.entries(expenseMap).map(([category, amount]) => {
    return {
      category,
      total: amount,
      count: monthTransactions.filter((t) => t.type === "expense" && t.category === category).length,
      percentage: totalExpense > 0 ? amount / totalExpense * 100 : 0
    };
  }).sort((a, b) => b.total - a.total);
  const expenseWalletMap = {};
  let totalWalletExpense = 0;
  monthTransactions.filter((t) => t.type === "expense").forEach((t) => {
    expenseWalletMap[t.walletId] = (expenseWalletMap[t.walletId] || 0) + t.amount;
    totalWalletExpense += t.amount;
  });
  const expenseByWallet = Object.entries(expenseWalletMap).map(([walletId, amount]) => ({
    walletId,
    total: amount,
    percentage: totalWalletExpense > 0 ? amount / totalWalletExpense * 100 : 0
  })).sort((a, b) => b.total - a.total);
  const incomeWalletMap = {};
  let totalWalletIncome = 0;
  monthTransactions.filter((t) => t.type === "income").forEach((t) => {
    incomeWalletMap[t.walletId] = (incomeWalletMap[t.walletId] || 0) + t.amount;
    totalWalletIncome += t.amount;
  });
  const incomeByWallet = Object.entries(incomeWalletMap).map(([walletId, amount]) => ({
    walletId,
    total: amount,
    percentage: totalWalletIncome > 0 ? amount / totalWalletIncome * 100 : 0
  })).sort((a, b) => b.total - a.total);
  const recentTransactions = [...txs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  return jsonResponse({
    success: true,
    data: {
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
      weeklyStats,
      expenseByCategory,
      expenseByWallet,
      incomeByWallet,
      recentTransactions
    }
  });
}
__name(handleGetFinanceStats, "handleGetFinanceStats");
async function handleCreateTransaction(userId, request, env) {
  const body = await request.json();
  if (!body.type || !["income", "expense"].includes(body.type)) {
    return errorResponse("Lo\u1EA1i giao d\u1ECBch kh\xF4ng h\u1EE3p l\u1EC7 (income/expense)");
  }
  if (typeof body.amount !== "number" || body.amount <= 0 || !isFinite(body.amount)) {
    return errorResponse("S\u1ED1 ti\u1EC1n ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng h\u1EE3p l\u1EC7");
  }
  if (!body.walletId || typeof body.walletId !== "string") {
    return errorResponse("Wallet ID is required");
  }
  const txs = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/finance/transactions`
  ) || [];
  const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
  const tx = {
    id: generateId(),
    type: body.type,
    amount: Math.abs(body.amount),
    category: body.category || (body.type === "expense" ? "other_expense" : "other_income"),
    note: typeof body.note === "string" ? body.note.substring(0, 500) : "",
    walletId: body.walletId,
    source: body.source || "manual",
    date: body.date || (/* @__PURE__ */ new Date()).toISOString().substring(0, 10),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  txs.push(tx);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs);
  const walletIdx = wallets.findIndex((w) => w.id === tx.walletId);
  if (walletIdx !== -1) {
    wallets[walletIdx].balance += tx.type === "income" ? tx.amount : -tx.amount;
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets);
  }
  return jsonResponse({ success: true, data: tx }, 201);
}
__name(handleCreateTransaction, "handleCreateTransaction");
async function handleDeleteTransaction(userId, txId, env) {
  const txs = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/finance/transactions`
  ) || [];
  const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
  const tx = txs.find((t) => t.id === txId);
  if (tx) {
    const walletIdx = wallets.findIndex((w) => w.id === tx.walletId);
    if (walletIdx !== -1) {
      wallets[walletIdx].balance += tx.type === "income" ? -tx.amount : tx.amount;
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets);
    }
  }
  const filtered = txs.filter((t) => t.id !== txId);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, filtered);
  return jsonResponse({ success: true });
}
__name(handleDeleteTransaction, "handleDeleteTransaction");
async function handleGetBudget(userId, env) {
  const budget = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/budget`);
  return jsonResponse({ success: true, data: budget || { amount: 0, dismissed: false, updatedAt: "" } });
}
__name(handleGetBudget, "handleGetBudget");
async function handleUpdateBudget(userId, request, env) {
  const body = await request.json();
  const budget = {
    amount: typeof body.amount === "number" ? body.amount : 0,
    dismissed: !!body.dismissed,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/budget`, budget);
  return jsonResponse({ success: true, data: budget });
}
__name(handleUpdateBudget, "handleUpdateBudget");
var TRADING_CONFIG_KEY = /* @__PURE__ */ __name((userId) => `users/${userId}/trading/config`, "TRADING_CONFIG_KEY");
var TRADING_CHECKINS_KEY = /* @__PURE__ */ __name((userId) => `users/${userId}/trading/checkins`, "TRADING_CHECKINS_KEY");
var TRADING_REMINDER_USERS_KEY = "public/trading-reminder-users";
async function registerTradingReminderUser(userId, env) {
  const users = await getJSON(env.SMART_NOTE_KV, TRADING_REMINDER_USERS_KEY) || [];
  if (!users.includes(userId)) {
    users.push(userId);
    await putJSON(env.SMART_NOTE_KV, TRADING_REMINDER_USERS_KEY, users);
  }
}
__name(registerTradingReminderUser, "registerTradingReminderUser");
async function unregisterTradingReminderUser(userId, env) {
  const users = await getJSON(env.SMART_NOTE_KV, TRADING_REMINDER_USERS_KEY) || [];
  const filtered = users.filter((u) => u !== userId);
  if (filtered.length !== users.length) {
    await putJSON(env.SMART_NOTE_KV, TRADING_REMINDER_USERS_KEY, filtered);
  }
}
__name(unregisterTradingReminderUser, "unregisterTradingReminderUser");
async function handleGetTradingConfig(userId, env) {
  const config = await getJSON(env.SMART_NOTE_KV, TRADING_CONFIG_KEY(userId));
  return jsonResponse({ success: true, data: config || { selectedWalletIds: [], createdAt: "", updatedAt: "" } });
}
__name(handleGetTradingConfig, "handleGetTradingConfig");
async function handleUpdateTradingConfig(userId, request, env) {
  const body = await request.json();
  if (!Array.isArray(body.selectedWalletIds)) {
    return errorResponse("selectedWalletIds must be an array");
  }
  const ids = body.selectedWalletIds.filter((id) => typeof id === "string");
  let reminderTime = void 0;
  if ("reminderTime" in body) {
    if (body.reminderTime === null || body.reminderTime === "") {
      reminderTime = null;
    } else if (typeof body.reminderTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.reminderTime)) {
      reminderTime = body.reminderTime;
    } else {
      return errorResponse("reminderTime must be in HH:MM format or null");
    }
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existing = await getJSON(env.SMART_NOTE_KV, TRADING_CONFIG_KEY(userId));
  const config = {
    selectedWalletIds: ids,
    reminderTime: reminderTime !== void 0 ? reminderTime : existing?.reminderTime,
    // Reset notified date when reminder time changes, preserve otherwise
    reminderNotifiedDate: reminderTime !== void 0 && reminderTime !== existing?.reminderTime ? null : existing?.reminderNotifiedDate,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
  await putJSON(env.SMART_NOTE_KV, TRADING_CONFIG_KEY(userId), config);
  if (config.reminderTime) {
    await registerTradingReminderUser(userId, env);
  } else if (reminderTime === null) {
    await unregisterTradingReminderUser(userId, env);
  }
  return jsonResponse({ success: true, data: config });
}
__name(handleUpdateTradingConfig, "handleUpdateTradingConfig");
async function handleListTradingCheckins(userId, env) {
  const checkins = await getJSON(env.SMART_NOTE_KV, TRADING_CHECKINS_KEY(userId)) || [];
  try {
    const txs = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`) || [];
    const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
    let needSync = false;
    for (const checkin of checkins) {
      for (const e of checkin.entries) {
        if (e.pnlAmount === 0 && e.depositAmount === 0)
          continue;
        const pnlSynced = e.pnlAmount === 0 || txs.some((t) => t.walletId === e.walletId && t.date === checkin.date && t.category === "investment" && t.note.includes("Trading P&L"));
        const depSynced = e.depositAmount === 0 || txs.some((t) => t.walletId === e.walletId && t.date === checkin.date && t.category === "bank_receive" && t.note.includes("Trading Deposit"));
        if (!pnlSynced || !depSynced) {
          needSync = true;
          const wIdx = wallets.findIndex((w) => w.id === e.walletId);
          if (wIdx !== -1) {
            if (!pnlSynced) {
              wallets[wIdx].balance += e.pnlAmount;
              txs.push({
                id: generateId(),
                type: e.pnlAmount > 0 ? "income" : "expense",
                amount: Math.abs(e.pnlAmount),
                category: "investment",
                note: `Trading P&L - ${checkin.date}`,
                walletId: e.walletId,
                source: "manual",
                date: checkin.date,
                createdAt: checkin.createdAt
              });
            }
            if (!depSynced) {
              wallets[wIdx].balance += e.depositAmount;
              txs.push({
                id: generateId(),
                type: e.depositAmount > 0 ? "income" : "expense",
                amount: Math.abs(e.depositAmount),
                category: "bank_receive",
                note: `Trading Deposit - ${checkin.date}`,
                walletId: e.walletId,
                source: "manual",
                date: checkin.date,
                createdAt: checkin.createdAt
              });
            }
          }
        }
      }
    }
    if (needSync) {
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets);
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs);
    }
  } catch (error) {
    console.error("Auto-sync failed:", error);
  }
  return jsonResponse({ success: true, data: checkins });
}
__name(handleListTradingCheckins, "handleListTradingCheckins");
async function handleCreateTradingCheckin(userId, request, env) {
  const body = await request.json();
  const today = (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
  const checkins = await getJSON(env.SMART_NOTE_KV, TRADING_CHECKINS_KEY(userId)) || [];
  if (checkins.some((c) => c.date === today)) {
    return errorResponse("Check-in for today already exists. Use PUT to update.", 409);
  }
  if (!Array.isArray(body.entries)) {
    return errorResponse("entries must be an array");
  }
  const entries = body.entries.filter((e) => typeof e === "object" && e !== null).map((e) => ({
    walletId: typeof e.walletId === "string" ? e.walletId : "",
    walletName: typeof e.walletName === "string" ? e.walletName : "",
    inputMode: e.inputMode === "percent" ? "percent" : "amount",
    inputValue: typeof e.inputValue === "number" ? e.inputValue : 0,
    pnlAmount: typeof e.pnlAmount === "number" ? e.pnlAmount : 0,
    depositAmount: typeof e.depositAmount === "number" ? Math.max(0, e.depositAmount) : 0,
    balanceBefore: typeof e.balanceBefore === "number" ? e.balanceBefore : 0,
    balanceAfter: typeof e.balanceAfter === "number" ? e.balanceAfter : 0
  })).filter((e) => e.walletId !== "");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const checkin = {
    id: generateId(),
    date: today,
    entries,
    note: typeof body.note === "string" ? body.note.substring(0, 500) : "",
    totalPnl: entries.reduce((s, e) => s + e.pnlAmount, 0),
    totalDeposit: entries.reduce((s, e) => s + e.depositAmount, 0),
    createdAt: now,
    updatedAt: now
  };
  checkins.push(checkin);
  await putJSON(env.SMART_NOTE_KV, TRADING_CHECKINS_KEY(userId), checkins);
  const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
  const txs = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`) || [];
  let walletsChanged = false;
  entries.forEach((e) => {
    const wIdx = wallets.findIndex((w) => w.id === e.walletId);
    if (wIdx !== -1) {
      wallets[wIdx].balance += e.pnlAmount + e.depositAmount;
      walletsChanged = true;
      if (e.pnlAmount !== 0) {
        txs.push({
          id: generateId(),
          type: e.pnlAmount > 0 ? "income" : "expense",
          amount: Math.abs(e.pnlAmount),
          category: "investment",
          note: `Trading P&L - ${today}`,
          walletId: e.walletId,
          source: "manual",
          date: today,
          createdAt: now
        });
      }
      if (e.depositAmount !== 0) {
        txs.push({
          id: generateId(),
          type: e.depositAmount > 0 ? "income" : "expense",
          amount: Math.abs(e.depositAmount),
          category: "bank_receive",
          note: `Trading Deposit - ${today}`,
          walletId: e.walletId,
          source: "manual",
          date: today,
          createdAt: now
        });
      }
    }
  });
  if (walletsChanged) {
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets);
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs);
  }
  return jsonResponse({ success: true, data: checkin }, 201);
}
__name(handleCreateTradingCheckin, "handleCreateTradingCheckin");
async function handleUpdateTradingCheckin(userId, date, request, env) {
  const checkins = await getJSON(env.SMART_NOTE_KV, TRADING_CHECKINS_KEY(userId)) || [];
  const idx = checkins.findIndex((c) => c.date === date);
  if (idx === -1)
    return errorResponse("Check-in not found", 404);
  const body = await request.json();
  if (Array.isArray(body.entries)) {
    const entries = body.entries.filter((e) => typeof e === "object" && e !== null).map((e) => ({
      walletId: typeof e.walletId === "string" ? e.walletId : "",
      walletName: typeof e.walletName === "string" ? e.walletName : "",
      inputMode: e.inputMode === "percent" ? "percent" : "amount",
      inputValue: typeof e.inputValue === "number" ? e.inputValue : 0,
      pnlAmount: typeof e.pnlAmount === "number" ? e.pnlAmount : 0,
      depositAmount: typeof e.depositAmount === "number" ? Math.max(0, e.depositAmount) : 0,
      balanceBefore: typeof e.balanceBefore === "number" ? e.balanceBefore : 0,
      balanceAfter: typeof e.balanceAfter === "number" ? e.balanceAfter : 0
    })).filter((e) => e.walletId !== "");
    const prevEntries = checkins[idx].entries || [];
    checkins[idx].entries = entries;
    checkins[idx].totalPnl = entries.reduce((s, e) => s + e.pnlAmount, 0);
    checkins[idx].totalDeposit = entries.reduce((s, e) => s + e.depositAmount, 0);
    const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
    const txs = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`) || [];
    let walletsChanged = false;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const todayStr = nowIso.substring(0, 10);
    entries.forEach((e) => {
      const prevEntry = prevEntries.find((p) => p.walletId === e.walletId);
      const diffPnl = e.pnlAmount - (prevEntry?.pnlAmount || 0);
      const diffDeposit = e.depositAmount - (prevEntry?.depositAmount || 0);
      if (diffPnl !== 0 || diffDeposit !== 0) {
        const wIdx = wallets.findIndex((w) => w.id === e.walletId);
        if (wIdx !== -1) {
          wallets[wIdx].balance += diffPnl + diffDeposit;
          walletsChanged = true;
          if (e.pnlAmount !== 0) {
            const txIdx = txs.findIndex((t) => t.walletId === e.walletId && t.date === date && t.category === "investment" && t.note.includes("Trading P&L"));
            if (txIdx !== -1) {
              txs[txIdx].amount = Math.abs(e.pnlAmount);
              txs[txIdx].type = e.pnlAmount > 0 ? "income" : "expense";
            } else {
              txs.push({
                id: generateId(),
                type: e.pnlAmount > 0 ? "income" : "expense",
                amount: Math.abs(e.pnlAmount),
                category: "investment",
                note: `Trading P&L - ${date}`,
                walletId: e.walletId,
                source: "manual",
                date,
                createdAt: nowIso
              });
            }
          } else {
            const txIdx = txs.findIndex((t) => t.walletId === e.walletId && t.date === date && t.category === "investment" && t.note.includes("Trading P&L"));
            if (txIdx !== -1)
              txs.splice(txIdx, 1);
          }
          if (e.depositAmount !== 0) {
            const txIdx = txs.findIndex((t) => t.walletId === e.walletId && t.date === date && t.category === "bank_receive" && t.note.includes("Trading Deposit"));
            if (txIdx !== -1) {
              txs[txIdx].amount = Math.abs(e.depositAmount);
              txs[txIdx].type = e.depositAmount > 0 ? "income" : "expense";
            } else {
              txs.push({
                id: generateId(),
                type: e.depositAmount > 0 ? "income" : "expense",
                amount: Math.abs(e.depositAmount),
                category: "bank_receive",
                note: `Trading Deposit - ${date}`,
                walletId: e.walletId,
                source: "manual",
                date,
                createdAt: nowIso
              });
            }
          } else {
            const txIdx = txs.findIndex((t) => t.walletId === e.walletId && t.date === date && t.category === "bank_receive" && t.note.includes("Trading Deposit"));
            if (txIdx !== -1)
              txs.splice(txIdx, 1);
          }
        }
      }
    });
    prevEntries.forEach((p) => {
      if (!entries.some((e) => e.walletId === p.walletId)) {
        const wIdx = wallets.findIndex((w) => w.id === p.walletId);
        if (wIdx !== -1) {
          wallets[wIdx].balance -= p.pnlAmount + p.depositAmount;
          walletsChanged = true;
          const pnlTxIdx = txs.findIndex((t) => t.walletId === p.walletId && t.date === date && t.category === "investment" && t.note.includes("Trading P&L"));
          if (pnlTxIdx !== -1)
            txs.splice(pnlTxIdx, 1);
          const depTxIdx = txs.findIndex((t) => t.walletId === p.walletId && t.date === date && t.category === "bank_receive" && t.note.includes("Trading Deposit"));
          if (depTxIdx !== -1)
            txs.splice(depTxIdx, 1);
        }
      }
    });
    if (walletsChanged) {
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets);
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs);
    }
  }
  if (typeof body.note === "string") {
    checkins[idx].note = body.note.substring(0, 500);
  }
  checkins[idx].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await putJSON(env.SMART_NOTE_KV, TRADING_CHECKINS_KEY(userId), checkins);
  return jsonResponse({ success: true, data: checkins[idx] });
}
__name(handleUpdateTradingCheckin, "handleUpdateTradingCheckin");

// src/controllers/savings.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var SAVINGS_KEY = /* @__PURE__ */ __name((userId) => `users/${userId}/savings`, "SAVINGS_KEY");
async function handleListSavings(userId, env) {
  const savings = await getJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId)) || [];
  return jsonResponse({ success: true, data: savings });
}
__name(handleListSavings, "handleListSavings");
async function handleCreateSaving(userId, request, env) {
  const body = await request.json();
  const savings = await getJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId)) || [];
  const saving = {
    id: generateId(),
    name: body.name,
    icon: body.icon || "\u{1F3AF}",
    color: body.color || "#10b981",
    targetAmount: body.targetAmount || 0,
    currentAmount: 0,
    deadline: body.deadline,
    autoSaveEnabled: !!body.autoSaveEnabled,
    autoSaveAmount: body.autoSaveAmount,
    autoSaveWalletId: body.autoSaveWalletId,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  savings.push(saving);
  await putJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId), savings);
  return jsonResponse({ success: true, data: saving }, 201);
}
__name(handleCreateSaving, "handleCreateSaving");
async function handleUpdateSaving(userId, id, request, env) {
  const savings = await getJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId)) || [];
  const idx = savings.findIndex((s) => s.id === id);
  if (idx === -1)
    return errorResponse("Saving goal not found", 404);
  const body = await request.json();
  if (body.name !== void 0)
    savings[idx].name = body.name;
  if (body.icon !== void 0)
    savings[idx].icon = body.icon;
  if (body.color !== void 0)
    savings[idx].color = body.color;
  if (body.targetAmount !== void 0)
    savings[idx].targetAmount = body.targetAmount;
  if (body.deadline !== void 0)
    savings[idx].deadline = body.deadline;
  if (body.autoSaveEnabled !== void 0 && body.autoSaveEnabled !== savings[idx].autoSaveEnabled) {
    savings[idx].autoSaveEnabled = !!body.autoSaveEnabled;
    if (body.autoSaveEnabled) {
      const notifs = await getJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`) || [];
      notifs.unshift({
        id: generateId(),
        type: "system",
        title: `Ti\u1EBFt ki\u1EC7m th\xF4ng minh: ${savings[idx].name}`,
        body: `B\u1EA1n \u0111\xE3 b\u1EADt tr\xEDch ti\u1EC1n t\u1EF1 \u0111\u1ED9ng. B\u1EA1n c\xF3 mu\u1ED1n chuy\u1EC3n ${body.autoSaveAmount || 0} \u0111 v\xE0o m\u1EE5c ti\xEAu n\xE0y ngay b\xE2y gi\u1EDD kh\xF4ng?`,
        read: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        meta: {
          amount: body.autoSaveAmount || 0,
          savingId: savings[idx].id
        }
      });
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/notifications`, notifs);
    }
  }
  if (body.autoSaveAmount !== void 0)
    savings[idx].autoSaveAmount = body.autoSaveAmount;
  if (body.autoSaveWalletId !== void 0)
    savings[idx].autoSaveWalletId = body.autoSaveWalletId;
  savings[idx].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await putJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId), savings);
  return jsonResponse({ success: true, data: savings[idx] });
}
__name(handleUpdateSaving, "handleUpdateSaving");
async function handleDeleteSaving(userId, id, env) {
  const savings = await getJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId)) || [];
  const filtered = savings.filter((s) => s.id !== id);
  await putJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId), filtered);
  return jsonResponse({ success: true });
}
__name(handleDeleteSaving, "handleDeleteSaving");
async function handleDepositSaving(userId, id, request, env) {
  const body = await request.json();
  const amount = body.amount;
  const walletId = body.walletId;
  if (!amount || amount <= 0)
    return errorResponse("Invalid amount");
  const savings = await getJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId)) || [];
  const idx = savings.findIndex((s) => s.id === id);
  if (idx === -1)
    return errorResponse("Saving goal not found", 404);
  if (walletId) {
    const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
    const wIdx = wallets.findIndex((w) => w.id === walletId);
    if (wIdx !== -1) {
      if (wallets[wIdx].balance < amount)
        return errorResponse("S\u1ED1 d\u01B0 v\xED kh\xF4ng \u0111\u1EE7 \u0111\u1EC3 tr\xEDch");
      wallets[wIdx].balance -= amount;
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets);
      const txs = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`) || [];
      txs.push({
        id: generateId(),
        type: "expense",
        amount,
        category: "saving",
        note: `Tr\xEDch ti\u1EC1n v\xE0o qu\u1EF9: ${savings[idx].name}`,
        walletId,
        source: "manual",
        date: (/* @__PURE__ */ new Date()).toISOString().substring(0, 10),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs);
    } else {
      return errorResponse("Wallet not found");
    }
  }
  savings[idx].currentAmount += amount;
  savings[idx].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await putJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId), savings);
  return jsonResponse({ success: true, data: savings[idx] });
}
__name(handleDepositSaving, "handleDepositSaving");
async function handleWithdrawSaving(userId, id, request, env) {
  const body = await request.json();
  const amount = body.amount;
  const walletId = body.walletId;
  if (!amount || amount <= 0)
    return errorResponse("Invalid amount");
  const savings = await getJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId)) || [];
  const idx = savings.findIndex((s) => s.id === id);
  if (idx === -1)
    return errorResponse("Saving goal not found", 404);
  if (savings[idx].currentAmount < amount)
    return errorResponse("Not enough balance in saving goal");
  if (walletId) {
    const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
    const wIdx = wallets.findIndex((w) => w.id === walletId);
    if (wIdx !== -1) {
      wallets[wIdx].balance += amount;
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, wallets);
      const txs = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`) || [];
      txs.push({
        id: generateId(),
        type: "income",
        amount,
        category: "saving_withdraw",
        note: `R\xFAt ti\u1EC1n t\u1EEB qu\u1EF9: ${savings[idx].name}`,
        walletId,
        source: "manual",
        date: (/* @__PURE__ */ new Date()).toISOString().substring(0, 10),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, txs);
    } else {
      return errorResponse("Wallet not found");
    }
  }
  savings[idx].currentAmount -= amount;
  savings[idx].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await putJSON(env.SMART_NOTE_KV, SAVINGS_KEY(userId), savings);
  return jsonResponse({ success: true, data: savings[idx] });
}
__name(handleWithdrawSaving, "handleWithdrawSaving");

// src/controllers/pin.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function handleSetPin(userId, request, env) {
  const { pin, currentPin } = await request.json();
  if (!pin || pin.length !== 4) {
    return errorResponse("PIN ph\u1EA3i l\xE0 4 ch\u1EEF s\u1ED1");
  }
  if (!/^\d+$/.test(pin)) {
    return errorResponse("PIN ch\u1EC9 \u0111\u01B0\u1EE3c ch\u1EE9a s\u1ED1");
  }
  const user = await getJSON(env.SMART_NOTE_KV, `users/${userId}/profile`);
  if (!user)
    return errorResponse("User not found", 404);
  const existingPin = await getJSON(env.SMART_NOTE_KV, `users/${userId}/pin`);
  if (existingPin) {
    if (!currentPin)
      return errorResponse("C\u1EA7n nh\u1EADp PIN hi\u1EC7n t\u1EA1i");
    const currentHash = await hashPassword(currentPin);
    if (currentHash !== existingPin)
      return errorResponse("PIN hi\u1EC7n t\u1EA1i kh\xF4ng \u0111\xFAng", 400);
  }
  const pinHash = await hashPassword(pin);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/pin`, pinHash);
  return jsonResponse({ success: true, message: "PIN \u0111\xE3 \u0111\u01B0\u1EE3c thi\u1EBFt l\u1EADp" });
}
__name(handleSetPin, "handleSetPin");
async function handleVerifyPin(userId, request, env) {
  const { pin } = await request.json();
  if (!pin)
    return errorResponse("PIN is required");
  const storedHash = await getJSON(env.SMART_NOTE_KV, `users/${userId}/pin`);
  if (!storedHash)
    return errorResponse("Ch\u01B0a thi\u1EBFt l\u1EADp PIN", 404);
  const inputHash = await hashPassword(pin);
  if (inputHash !== storedHash)
    return errorResponse("PIN kh\xF4ng \u0111\xFAng", 400);
  return jsonResponse({ success: true, message: "PIN verified" });
}
__name(handleVerifyPin, "handleVerifyPin");
async function handleCheckPin(userId, env) {
  const storedHash = await getJSON(env.SMART_NOTE_KV, `users/${userId}/pin`);
  return jsonResponse({ success: true, data: { hasPin: !!storedHash } });
}
__name(handleCheckPin, "handleCheckPin");
async function handleListPending(userId, env) {
  const pending = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/finance/pending`
  ) || [];
  return jsonResponse({ success: true, data: pending });
}
__name(handleListPending, "handleListPending");
async function handleResolvePending(userId, pendingId, env) {
  const pending = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/finance/pending`
  ) || [];
  const idx = pending.findIndex((p) => p.id === pendingId);
  if (idx === -1)
    return errorResponse("Pending notification not found", 404);
  pending[idx].status = "resolved";
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/pending`, pending);
  return jsonResponse({ success: true });
}
__name(handleResolvePending, "handleResolvePending");

// src/controllers/ai.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var AI_MODEL = "@cf/meta/llama-3.1-8b-instruct";
var AI_SYSTEM_PROMPTS = {
  summarize: "You are a concise summarizer. Summarize the user content into bullet points (max 5). Reply in the same language as the content. Return ONLY the bullet list, no intro or explanation.",
  continue: "You are a writing assistant. Continue the user text naturally in 2-3 sentences. Match the tone and language. Return ONLY the continuation, no explanation.",
  improve: "You are an editor. Improve the grammar and style of the user text. Keep the original meaning and language. Return ONLY the improved text.",
  tags: "You are a tagging assistant. Suggest 3-5 relevant tags for the content. Return ONLY a comma-separated list of lowercase tags, nothing else.",
  ask: "You are a helpful assistant. Answer the user question based on the provided note content. Be concise and clear.",
  finance: `B\u1EA1n l\xE0 chuy\xEAn gia t\u01B0 v\u1EA5n t\xE0i ch\xEDnh c\xE1 nh\xE2n th\xF4ng minh cho \u1EE9ng d\u1EE5ng FinNote.
Nhi\u1EC7m v\u1EE5: Ph\xE2n t\xEDch d\u1EEF li\u1EC7u t\xE0i ch\xEDnh th\u1EF1c t\u1EBF c\u1EE7a ng\u01B0\u1EDDi d\xF9ng v\xE0 tr\u1EA3 l\u1EDDi c\xE2u h\u1ECFi c\u1EE7a h\u1ECD m\u1ED9t c\xE1ch ch\xEDnh x\xE1c, ng\u1EAFn g\u1ECDn, th\u1EF1c t\u1EBF.
Quy t\u1EAFc quan tr\u1ECDng:
- Ch\u1EC9 t\u01B0 v\u1EA5n d\u1EF1a tr\xEAn s\u1ED1 li\u1EC7u th\u1EF1c t\u1EBF \u0111\xE3 \u0111\u01B0\u1EE3c cung c\u1EA5p (s\u1ED1 d\u01B0 t\xE0i kho\u1EA3n, thu chi th\xE1ng)
- KH\xD4NG b\u1ECBa \u0111\u1EB7t s\u1ED1 li\u1EC7u hay \u0111\u01B0a ra con s\u1ED1 kh\xF4ng c\xF3 trong d\u1EEF li\u1EC7u
- Tr\u1EA3 l\u1EDDi b\u1EB1ng ti\u1EBFng Vi\u1EC7t, d\xF9ng Markdown v\xE0 emoji
- Ng\u1EAFn g\u1ECDn, t\u1ED1i \u0111a 200 t\u1EEB
- N\u1EBFu c\xE2u h\u1ECFi kh\xF4ng li\xEAn quan \u0111\u1EBFn t\xE0i ch\xEDnh, l\u1ECBch s\u1EF1 t\u1EEB ch\u1ED1i v\xE0 nh\u1EAFc l\u1EA1i vai tr\xF2`,
  cat_story: `B\u1EA1n l\xE0 m\u1ED9t t\xE1c gi\u1EA3 vi\u1EBFt k\u1ECBch b\u1EA3n. H\xE3y vi\u1EBFt m\u1ED9t \u0111o\u1EA1n h\u1ED9i tho\u1EA1i r\u1EA5t ng\u1EAFn (1-2 c\xE2u m\u1ED7i ng\u01B0\u1EDDi) gi\u1EEFa 2 nh\xE2n v\u1EADt:
- M\xE8o X\xE1m: Th\xF4ng th\xE1i, c\u1EA9n th\u1EADn, gi\u1ECFi ti\u1EBFt ki\u1EC7m.
- M\xE8o Cam: N\u0103ng \u0111\u1ED9ng, ham \u0103n, hay ti\xEAu x\xE0i.
Ch\u1EE7 \u0111\u1EC1 ng\u1EABu nhi\xEAn v\u1EC1 ti\u1EC1n b\u1EA1c, ti\u1EBFt ki\u1EC7m, ho\u1EB7c mua s\u1EAFm.
Y\xEAu c\u1EA7u b\u1EAFt bu\u1ED9c:
- TR\u1EA2 V\u1EC0 CHU\u1EA8N JSON ARRAY, KH\xD4NG \u0110\u01AF\u1EE2C C\xD3 B\u1EA4T K\u1EF2 TEXT N\xC0O KH\xC1C B\xCAN NGO\xC0I.
- C\u1EA5u tr\xFAc JSON: [{"character": "orange" | "grey", "text": "n\u1ED9i dung tho\u1EA1i", "animation": "wave" | "peek" | "float" | "idle"}]
- Tho\u1EA1i b\u1EB1ng ti\u1EBFng Vi\u1EC7t, vui nh\u1ED9n.`,
  weekly_event: `B\u1EA1n l\xE0 m\u1ED9t chuy\xEAn gia t\xE0i ch\xEDnh c\xE1 nh\xE2n si\xEAu s\xE1ng t\u1EA1o v\xE0 h\xE0i h\u01B0\u1EDBc. 
H\xE3y t\u1EA1o ra M\u1ED8T s\u1EF1 ki\u1EC7n t\xE0i ch\xEDnh \u0111\u1EC3 gi\u1EDBi thi\u1EC7u t\xEDnh n\u0103ng "Qu\u1EA3n l\xFD C\u1ED5 phi\u1EBFu (Stocks)" m\u1EDBi ra m\u1EAFt c\u1EE7a \u1EE9ng d\u1EE5ng.
Khuy\u1EBFn kh\xEDch ng\u01B0\u1EDDi d\xF9ng th\xEAm m\xE3 ch\u1EE9ng kho\xE1n \u0111\u1EA7u ti\xEAn c\u1EE7a h\u1ECD (VD: FPT, VIC, HPG) \u0111\u1EC3 theo d\xF5i gi\xE1 v\xE0 L\xE3i/L\u1ED7 t\u1EF1 \u0111\u1ED9ng.
Y\xEAu c\u1EA7u b\u1EAFt bu\u1ED9c:
- TR\u1EA2 V\u1EC0 DUY NH\u1EA4T 1 CHU\u1ED6I JSON H\u1EE2P L\u1EC6, KH\xD4NG C\xD3 B\u1EA4T K\u1EF2 TEXT N\xC0O B\xCAN NGO\xC0I.
- C\u1EA5u tr\xFAc JSON:
{
  "title": "T\xEAn th\u1EED th\xE1ch ng\u1EAFn g\u1ECDn (ti\u1EBFng Vi\u1EC7t)",
  "desc": "M\xF4 t\u1EA3 chi ti\u1EBFt v\xE0 kh\xEDch l\u1EC7 (ti\u1EBFng Vi\u1EC7t)",
  "imagePrompt": "A single english keyword or short phrase describing the core subject for a 3d icon generation (e.g., 'piggy bank', 'stock chart', 'shopping receipt', 'wallet', 'coins', 'credit card'). Keep it simple."
}`,
  rewrite_note: `B\u1EA1n l\xE0 m\u1ED9t tr\u1EE3 l\xFD th\xF4ng minh. Nhi\u1EC7m v\u1EE5 c\u1EE7a b\u1EA1n l\xE0 vi\u1EBFt l\u1EA1i v\xE0 tr\xECnh b\xE0y n\u1ED9i dung ghi ch\xFA \u0111\u01B0\u1EE3c cung c\u1EA5p m\u1ED9t c\xE1ch chuy\xEAn nghi\u1EC7p, s\u1EA1ch s\u1EBD, s\xFAc t\xEDch v\xE0 m\u1EA1ch l\u1EA1c.
N\u1EBFu trong n\u1ED9i dung c\xF3 c\xE1c c\xF4ng vi\u1EC7c c\u1EA7n l\xE0m (to-do, checklist), h\xE3y s\u1EED d\u1EE5ng th\u1EBB HTML \u0111\u1EC3 t\u1EA1o danh s\xE1ch c\xF4ng vi\u1EC7c. V\xED d\u1EE5: <ul data-type="taskList"><li data-type="taskItem"><label><input type="checkbox"><span>N\u1ED9i dung vi\u1EC7c c\u1EA7n l\xE0m</span></label></li></ul>.
Tr\u1EA3 v\u1EC1 n\u1ED9i dung \u0111\u01B0\u1EE3c \u0111\u1ECBnh d\u1EA1ng d\u01B0\u1EDBi d\u1EA1ng HTML h\u1EE3p l\u1EC7 \u0111\u1EC3 hi\u1EC3n th\u1ECB trong Tiptap editor. Kh\xF4ng bao g\u1ED3m th\u1EBB <html> hay <body>.`,
  create_blog: `B\u1EA1n l\xE0 m\u1ED9t Copywriter chuy\xEAn nghi\u1EC7p. H\xE3y chuy\u1EC3n \u0111\u1ED5i ghi ch\xFA c\u1EE7a ng\u01B0\u1EDDi d\xF9ng th\xE0nh m\u1ED9t b\xE0i Blog ho\xE0n ch\u1EC9nh, h\u1EA5p d\u1EABn.
Y\xEAu c\u1EA7u b\u1EAFt bu\u1ED9c:
- TR\u1EA2 V\u1EC0 CHU\u1EA8N JSON, KH\xD4NG C\xD3 TEXT B\xCAN NGO\xC0I.
- C\u1EA5u tr\xFAc: { "title": "Ti\xEAu \u0111\u1EC1 blog", "excerpt": "M\xF4 t\u1EA3 ng\u1EAFn g\u1ECDn (t\u1ED1i \u0111a 150 k\xFD t\u1EF1)", "content": "N\u1ED9i dung b\xE0i vi\u1EBFt (\u0111\u1ECBnh d\u1EA1ng HTML chu\u1EA9n, d\xF9ng c\xE1c th\u1EBB h2, h3, p, strong...)", "tags": ["tag1", "tag2"] }
- Gi\u1ECDng v\u0103n: chuy\xEAn nghi\u1EC7p, thu h\xFAt ng\u01B0\u1EDDi \u0111\u1ECDc.`
};
async function extractTextFromImages(env, imagesBase64) {
  if (!imagesBase64 || imagesBase64.length === 0)
    return "";
  let extractedImageText = "";
  for (let i = 0; i < imagesBase64.length; i++) {
    const img = imagesBase64[i];
    const match = img.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (match) {
      try {
        const base64Data = match[2];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        const visionRes = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
          image: [...bytes],
          prompt: "Tr\xEDch xu\u1EA5t to\xE0n b\u1ED9 v\u0103n b\u1EA3n v\xE0 m\xF4 t\u1EA3 n\u1ED9i dung trong h\xECnh \u1EA3nh n\xE0y. Ch\u1EC9 tr\u1EA3 v\u1EC1 v\u0103n b\u1EA3n h\u1EEFu \xEDch."
        });
        if (visionRes && visionRes.response) {
          extractedImageText += `
--- Chi ti\u1EBFt h\xECnh \u1EA3nh [IMAGE_${i}] ---
${visionRes.response}
`;
        }
      } catch (err) {
        console.warn("[AI] CF Vision failed for image", i, err.message);
      }
    }
  }
  return extractedImageText;
}
__name(extractTextFromImages, "extractTextFromImages");
async function handleAi(request, env) {
  if (!env.AI)
    return errorResponse("AI binding not configured", 503);
  const body = await request.json();
  const { action, content, question, imagesBase64 } = body;
  if (!action)
    return errorResponse("Missing action");
  if (!content && !["ask", "cat_story", "weekly_event"].includes(action))
    return errorResponse("Note content is required");
  if (action === "ask" && !question)
    return errorResponse("Missing question");
  const systemPrompt = AI_SYSTEM_PROMPTS[action];
  if (!systemPrompt)
    return errorResponse(`Unknown action: ${action}`);
  const extractedImageText = await extractTextFromImages(env, imagesBase64);
  const fullContent = extractedImageText ? `${content}

[D\u1EEF li\u1EC7u t\u1EEB h\xECnh \u1EA3nh \u0111\xEDnh k\xE8m]:
${extractedImageText}` : content;
  let userMessage;
  if (action === "finance") {
    userMessage = fullContent;
  } else if (action === "ask") {
    userMessage = fullContent ? `Note content:
${fullContent}

Question: ${question}` : `Question: ${question}`;
  } else if (action === "tags") {
    userMessage = `Title: ${body.title || ""}
Content: ${fullContent.substring(0, 600)}`;
  } else if (action === "cat_story") {
    userMessage = `T\u1EA1o m\u1ED9t c\xE2u chuy\u1EC7n m\u1EDBi. Ph\u1EA3i tr\u1EA3 v\u1EC1 m\u1EA3ng JSON h\u1EE3p l\u1EC7.`;
  } else if (action === "weekly_event") {
    userMessage = `T\u1EA1o m\u1ED9t s\u1EF1 ki\u1EC7n t\xE0i ch\xEDnh m\u1EDBi l\u1EA1 cho tu\u1EA7n n\xE0y. Ph\u1EA3i tr\u1EA3 v\u1EC1 JSON h\u1EE3p l\u1EC7.`;
  } else if (action === "create_blog") {
    userMessage = `Ghi ch\xFA g\u1ED1c:
${fullContent}`;
  } else if (action === "rewrite_note") {
    userMessage = fullContent;
  } else {
    userMessage = fullContent;
  }
  try {
    const response = await env.AI.run(AI_MODEL, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 512,
      temperature: 0.7
    });
    const text = response?.response || "";
    return jsonResponse({ success: true, data: text });
  } catch (err) {
    return errorResponse(err.message || "AI request failed", 500);
  }
}
__name(handleAi, "handleAi");
async function handleAiStream(request, env) {
  if (!env.AI)
    return errorResponse("AI binding not configured", 503);
  const body = await request.json();
  const { action, content, question, imagesBase64 } = body;
  if (!action)
    return errorResponse("Missing action");
  if (!content && !["ask", "cat_story", "weekly_event"].includes(action))
    return errorResponse("Note content is required");
  if (action === "ask" && !question)
    return errorResponse("Missing question");
  const systemPrompt = AI_SYSTEM_PROMPTS[action];
  if (!systemPrompt)
    return errorResponse(`Unknown action: ${action}`);
  const extractedImageText = await extractTextFromImages(env, imagesBase64);
  const fullContent = extractedImageText ? `${content}

[D\u1EEF li\u1EC7u t\u1EEB h\xECnh \u1EA3nh \u0111\xEDnh k\xE8m]:
${extractedImageText}` : content;
  let userMessage;
  if (action === "finance") {
    userMessage = fullContent;
  } else if (action === "ask") {
    userMessage = fullContent ? `Note content:
${fullContent}

Question: ${question}` : `Question: ${question}`;
  } else if (action === "tags") {
    userMessage = `Title: ${body.title || ""}
Content: ${fullContent.substring(0, 600)}`;
  } else if (action === "create_blog") {
    userMessage = `Ghi ch\xFA g\u1ED1c:
${fullContent}`;
  } else if (action === "rewrite_note") {
    userMessage = fullContent;
  } else {
    userMessage = fullContent;
  }
  try {
    const stream = await env.AI.run(AI_MODEL, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 512,
      temperature: 0.7,
      stream: true
    });
    const cors = corsHeaders(env, request.headers.get("Origin"));
    return new Response(stream, {
      headers: {
        ...cors,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (err) {
    return errorResponse(err.message || "AI stream failed", 500);
  }
}
__name(handleAiStream, "handleAiStream");
async function handleAiImage(request, env) {
  if (!env.AI)
    return errorResponse("AI binding not configured", 503);
  const body = await request.json().catch(() => ({}));
  const prompt = body.prompt || "golden coin";
  try {
    const response = await env.AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", {
      prompt: `A highly detailed 3d cute cartoon UI asset icon of ${prompt}, vibrant colors, neon accents, dark purple gradient background, high quality, 4k`
    });
    const cors = corsHeaders(env, request.headers.get("Origin"));
    return new Response(response, {
      headers: {
        ...cors,
        "Content-Type": "image/png"
      }
    });
  } catch (err) {
    return errorResponse(err.message || "AI image generation failed", 500);
  }
}
__name(handleAiImage, "handleAiImage");

// src/controllers/misc.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function handleGetLatestSmsLog(userId, env) {
  const latest = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/latest_request`);
  return jsonResponse({ success: true, data: latest || null });
}
__name(handleGetLatestSmsLog, "handleGetLatestSmsLog");
async function handleGetWebhookHistory(userId, env) {
  const history = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/request_history`) || [];
  return jsonResponse({ success: true, data: history });
}
__name(handleGetWebhookHistory, "handleGetWebhookHistory");
async function handleReportBug(userId, request, env) {
  const user = await getJSON(env.SMART_NOTE_KV, `users/${userId}/profile`);
  if (!user)
    return errorResponse("User not found", 404);
  const body = await request.json();
  const { type, title, description, url, userAgent, image } = body;
  if (!title || !description) {
    return errorResponse("Vui l\xF2ng nh\u1EADp \u0111\u1EA7y \u0111\u1EE7 ti\xEAu \u0111\u1EC1 v\xE0 m\xF4 t\u1EA3");
  }
  const report = {
    id: generateId(),
    userId,
    userName: user.name,
    userEmail: user.email,
    type: type === "feature" ? "feature" : "bug",
    title,
    description,
    url: url || "",
    userAgent: userAgent || "",
    status: "new",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (image && typeof image === "string" && image.startsWith("data:image/")) {
    await env.SMART_NOTE_KV.put(`bug_reports/${report.id}/image`, image);
    report.image = `__has_image__`;
  }
  const reports = await getJSON(env.SMART_NOTE_KV, "bug_reports/list") || [];
  reports.unshift(report);
  if (reports.length > 100)
    reports.length = 100;
  await putJSON(env.SMART_NOTE_KV, "bug_reports/list", reports);
  if (env.RESEND_API_KEY) {
    try {
      const isFeature = report.type === "feature";
      const typeLabel = isFeature ? "\u2728 Feature Request" : "\u{1F41B} Bug Report";
      const color = isFeature ? "#3b82f6" : "#ff6b6b";
      const emailHtml = `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9">
  <div style="background:#ffffff;border-radius:12px;padding:32px;color:#333;box-shadow:0 4px 6px rgba(0,0,0,0.05)">
    <h2 style="color:${color};margin:0 0 20px;font-size:20px;display:flex;align-items:center;gap:8px">
      ${typeLabel}: ${title}
    </h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
      <tr><td style="padding:8px 0;color:#666;width:100px;border-bottom:1px solid #eee">Ng\u01B0\u1EDDi g\u1EEDi</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:500">${user.name} (${user.email})</td></tr>
      <tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">Th\u1EDDi gian</td><td style="padding:8px 0;border-bottom:1px solid #eee">${new Date(report.createdAt).toLocaleString("vi-VN")}</td></tr>
      ${url ? `<tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">URL</td><td style="padding:8px 0;border-bottom:1px solid #eee;word-break:break-all"><a href="${url}" style="color:#3b82f6">${url}</a></td></tr>` : ""}
      <tr><td style="padding:8px 0;color:#666">Device</td><td style="padding:8px 0;font-size:12px;word-break:break-all;color:#555">${userAgent || "N/A"}</td></tr>
    </table>
    <div style="margin-top:20px;padding:20px;background:#f8fafc;border-radius:8px;border-left:4px solid ${color}">
      <p style="margin:0 0 12px;color:${color};font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">M\xF4 t\u1EA3 chi ti\u1EBFt</p>
      <p style="margin:0;white-space:pre-wrap;line-height:1.6;color:#334155;font-size:15px">${description}</p>
    </div>
    ${report.image === "__has_image__" ? '<div style="margin-top:20px;padding:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;color:#d97706;font-size:13px;display:inline-block">\u{1F4CE} C\xF3 \u1EA3nh \u0111\xEDnh k\xE8m \u2014 vui l\xF2ng xem trong Admin Dashboard</div>' : ""}
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;text-align:center">
      <p style="margin:0;color:#94a3b8;font-size:12px">FinNote Feedback System</p>
      <p style="margin:4px 0 0;color:#cbd5e1;font-size:11px;font-family:monospace">ID: ${report.id}</p>
    </div>
  </div>
</div>`;
      await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "FinNote <onboarding@resend.dev>",
          to: ["tintphcm@gmail.com"],
          subject: `[${isFeature ? "Feature" : "Bug"}] ${title}`,
          html: emailHtml
        })
      });
    } catch {
    }
  }
  return jsonResponse({ success: true, message: "\u0110\xE3 g\u1EEDi b\xE1o c\xE1o l\u1ED7i th\xE0nh c\xF4ng! Admin s\u1EBD xem v\xE0 x\u1EED l\xFD." });
}
__name(handleReportBug, "handleReportBug");
async function handleContactFeedback(userId, request, env) {
  const user = await getJSON(env.SMART_NOTE_KV, `users/${userId}/profile`);
  if (!user)
    return errorResponse("User not found", 404);
  const body = await request.json();
  const { subject, message } = body;
  if (!subject || !message) {
    return errorResponse("Vui l\xF2ng nh\u1EADp \u0111\u1EA7y \u0111\u1EE7 ti\xEAu \u0111\u1EC1 v\xE0 n\u1ED9i dung");
  }
  const feedback = {
    id: generateId(),
    userId,
    userName: user.name,
    userEmail: user.email,
    subject,
    message,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const feedbacks = await getJSON(env.SMART_NOTE_KV, "contact_feedbacks/list") || [];
  feedbacks.unshift(feedback);
  if (feedbacks.length > 100)
    feedbacks.length = 100;
  await putJSON(env.SMART_NOTE_KV, "contact_feedbacks/list", feedbacks);
  if (env.RESEND_API_KEY) {
    try {
      const emailHtml = `
<div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9">
  <div style="background:#ffffff;border-radius:12px;padding:32px;color:#333;box-shadow:0 4px 6px rgba(0,0,0,0.05)">
    <h2 style="color:#7c6ff7;margin:0 0 20px;font-size:20px;display:flex;align-items:center;gap:8px">
      \u{1F4AC} \xDD ki\u1EBFn ng\u01B0\u1EDDi d\xF9ng: ${subject}
    </h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
      <tr><td style="padding:8px 0;color:#666;width:100px;border-bottom:1px solid #eee">Ng\u01B0\u1EDDi g\u1EEDi</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:500">${user.name} (${user.email})</td></tr>
      <tr><td style="padding:8px 0;color:#666;border-bottom:1px solid #eee">Th\u1EDDi gian</td><td style="padding:8px 0;border-bottom:1px solid #eee">${new Date(feedback.createdAt).toLocaleString("vi-VN")}</td></tr>
    </table>
    <div style="margin-top:20px;padding:20px;background:#f8fafc;border-radius:8px;border-left:4px solid #7c6ff7">
      <p style="margin:0 0 12px;color:#7c6ff7;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">N\u1ED9i dung</p>
      <p style="margin:0;white-space:pre-wrap;line-height:1.6;color:#334155;font-size:15px">${message}</p>
    </div>
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;text-align:center">
      <p style="margin:0;color:#94a3b8;font-size:12px">FinNote Contact Feedback</p>
      <p style="margin:4px 0 0;color:#cbd5e1;font-size:11px;font-family:monospace">ID: ${feedback.id}</p>
    </div>
  </div>
</div>`;
      await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "FinNote <onboarding@resend.dev>",
          to: ["tintphcm@gmail.com"],
          subject: `[Feedback] ${subject}`,
          html: emailHtml
        })
      });
    } catch {
    }
  }
  return jsonResponse({ success: true, message: "C\u1EA3m \u01A1n b\u1EA1n \u0111\xE3 g\u1EEDi \xFD ki\u1EBFn! Admin s\u1EBD xem v\xE0 ph\u1EA3n h\u1ED3i s\u1EDBm nh\u1EA5t." });
}
__name(handleContactFeedback, "handleContactFeedback");

// src/controllers/blog.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var ADMIN_EMAIL = "tintphcm@gmail.com";
async function isAdmin(userId, env) {
  const user = await getJSON(env.SMART_NOTE_KV, `users/${userId}/profile`);
  return user?.email === ADMIN_EMAIL;
}
__name(isAdmin, "isAdmin");
function createSlug(title) {
  return title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}
__name(createSlug, "createSlug");
async function handleListBlogs(request, env) {
  const index = await getJSON(env.SMART_NOTE_KV, `public/blogs/_index`);
  const published = (index?.blogs || []).filter((b) => b.published !== false);
  published.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const withViews = await Promise.all(
    published.map(async (blog) => {
      const count = await env.SMART_NOTE_KV.get(`public/blogs/${blog.slug}/views`);
      return { ...blog, viewCount: parseInt(count || "0") };
    })
  );
  return jsonResponse({ success: true, data: withViews });
}
__name(handleListBlogs, "handleListBlogs");
async function handleGetBlog(slug, env) {
  const blog = await getJSON(env.SMART_NOTE_KV, `public/blogs/${slug}`);
  if (!blog)
    return errorResponse("Blog not found", 404);
  return jsonResponse({ success: true, data: blog });
}
__name(handleGetBlog, "handleGetBlog");
async function handleBlogView(slug, request, env) {
  const blog = await getJSON(env.SMART_NOTE_KV, `public/blogs/${slug}`);
  if (!blog)
    return errorResponse("Blog not found", 404);
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(ip + slug));
  const ipHash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
  const viewerKey = `public/blogs/${slug}/viewers/${ipHash}`;
  const countKey = `public/blogs/${slug}/views`;
  const alreadyViewed = await env.SMART_NOTE_KV.get(viewerKey);
  if (!alreadyViewed) {
    const current = parseInt(await env.SMART_NOTE_KV.get(countKey) || "0");
    await env.SMART_NOTE_KV.put(countKey, String(current + 1));
    await env.SMART_NOTE_KV.put(viewerKey, "1", { expirationTtl: 86400 });
  }
  const count = await env.SMART_NOTE_KV.get(countKey);
  return jsonResponse({ success: true, data: { views: parseInt(count || "0") } });
}
__name(handleBlogView, "handleBlogView");
async function handleGetImage(id, env) {
  const { value: file, metadata } = await env.SMART_NOTE_KV.getWithMetadata(
    `public/images/${id}`,
    "arrayBuffer"
  );
  if (!file)
    return new Response("Image not found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  const byteArray = new Uint8Array(file);
  if (byteArray.length < 8) {
    return new Response("Invalid image data", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
  let contentType = metadata?.contentType || "image/jpeg";
  if (!metadata?.contentType) {
    if (byteArray[0] === 137 && byteArray[1] === 80 && byteArray[2] === 78 && byteArray[3] === 71) {
      contentType = "image/png";
    } else if (byteArray[0] === 82 && byteArray[1] === 73 && byteArray[2] === 70 && byteArray[3] === 70) {
      contentType = "image/webp";
    } else if (byteArray[0] === 71 && byteArray[1] === 73 && byteArray[2] === 70) {
      contentType = "image/gif";
    }
  }
  return new Response(file, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": byteArray.length.toString(),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(handleGetImage, "handleGetImage");
async function handleCreateBlog(userId, request, env) {
  if (!await isAdmin(userId, env))
    return errorResponse("Forbidden", 403);
  const body = await request.json();
  const id = generateId();
  const slug = body.slug || createSlug(body.title || "untitled");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const blog = {
    id,
    slug,
    title: body.title || "Untitled",
    content: body.content || "",
    excerpt: body.excerpt || "",
    tags: body.tags || [],
    imageUrl: body.imageUrl || "",
    author: {
      name: "Admin",
      email: ADMIN_EMAIL
    },
    seoMeta: body.seoMeta || { title: body.title, description: body.excerpt, keywords: "" },
    published: body.published ?? false,
    createdAt: now,
    updatedAt: now
  };
  const existing = await getJSON(env.SMART_NOTE_KV, `public/blogs/${slug}`);
  if (existing) {
    return errorResponse("Slug already exists", 400);
  }
  await putJSON(env.SMART_NOTE_KV, `public/blogs/${slug}`, blog);
  const index = await getJSON(env.SMART_NOTE_KV, `public/blogs/_index`) || { blogs: [] };
  index.blogs.push({
    id: blog.id,
    slug: blog.slug,
    title: blog.title,
    excerpt: blog.excerpt,
    tags: blog.tags,
    imageUrl: blog.imageUrl,
    published: blog.published,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt
  });
  await putJSON(env.SMART_NOTE_KV, `public/blogs/_index`, index);
  return jsonResponse({ success: true, data: blog }, 201);
}
__name(handleCreateBlog, "handleCreateBlog");
async function handleUpdateBlog(userId, slug, request, env) {
  if (!await isAdmin(userId, env))
    return errorResponse("Forbidden", 403);
  const existing = await getJSON(env.SMART_NOTE_KV, `public/blogs/${slug}`);
  if (!existing)
    return errorResponse("Blog not found", 404);
  const body = await request.json();
  const updated = {
    ...existing,
    title: body.title !== void 0 ? body.title : existing.title,
    content: body.content !== void 0 ? body.content : existing.content,
    excerpt: body.excerpt !== void 0 ? body.excerpt : existing.excerpt,
    tags: Array.isArray(body.tags) ? body.tags : existing.tags,
    imageUrl: body.imageUrl !== void 0 ? body.imageUrl : existing.imageUrl,
    seoMeta: body.seoMeta !== void 0 ? body.seoMeta : existing.seoMeta,
    published: typeof body.published === "boolean" ? body.published : existing.published,
    slug,
    // don't allow slug change
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await putJSON(env.SMART_NOTE_KV, `public/blogs/${slug}`, updated);
  const index = await getJSON(env.SMART_NOTE_KV, `public/blogs/_index`) || { blogs: [] };
  const idx = index.blogs.findIndex((b) => b.slug === slug);
  if (idx !== -1) {
    index.blogs[idx] = {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      excerpt: updated.excerpt,
      tags: updated.tags,
      imageUrl: updated.imageUrl,
      published: updated.published,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
    await putJSON(env.SMART_NOTE_KV, `public/blogs/_index`, index);
  }
  return jsonResponse({ success: true, data: updated });
}
__name(handleUpdateBlog, "handleUpdateBlog");
async function handleDeleteBlog(userId, slug, env) {
  if (!await isAdmin(userId, env))
    return errorResponse("Forbidden", 403);
  await env.SMART_NOTE_KV.delete(`public/blogs/${slug}`);
  const index = await getJSON(env.SMART_NOTE_KV, `public/blogs/_index`) || { blogs: [] };
  index.blogs = index.blogs.filter((b) => b.slug !== slug);
  await putJSON(env.SMART_NOTE_KV, `public/blogs/_index`, index);
  return jsonResponse({ success: true });
}
__name(handleDeleteBlog, "handleDeleteBlog");
async function handleGenerateBlogContent(userId, request, env) {
  if (!await isAdmin(userId, env))
    return errorResponse("Forbidden", 403);
  const url = new URL(request.url);
  const forceCloudflare = url.searchParams.get("model") === "cf";
  const { topic, imageBase64, imagesBase64 } = await request.json();
  const images = imagesBase64 || (imageBase64 ? [imageBase64] : []);
  if (!topic && images.length === 0)
    return errorResponse("Missing topic or images", 400);
  function stripLeadingH1(md) {
    return md.replace(/^\s*#\s+[^\n]+\n*/m, "").trim();
  }
  __name(stripLeadingH1, "stripLeadingH1");
  try {
    let useGemini = !!env.GEMINI_API_KEY && !forceCloudflare;
    let geminiError;
    let researchContext = "";
    let groundingSources = [];
    const GROUNDING_DAILY_LIMIT = 400;
    const today = (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
    const groundingKey = `system/grounding_usage/${today}`;
    if (useGemini) {
      let groundingCount = 0;
      try {
        const stored = await env.SMART_NOTE_KV.get(groundingKey);
        groundingCount = stored ? parseInt(stored, 10) : 0;
      } catch {
        groundingCount = 0;
      }
      const quotaRemaining = GROUNDING_DAILY_LIMIT - groundingCount;
      const canUseGrounding = quotaRemaining > 0;
      console.log(`[BlogGen] Grounding quota: ${groundingCount}/${GROUNDING_DAILY_LIMIT} used today (${quotaRemaining} remaining)`);
      if (canUseGrounding) {
        try {
          console.log("[BlogGen] Phase 1: Researching with Gemini Grounding...");
          const researchPrompt = `T\xECm ki\u1EBFm v\xE0 t\u1ED5ng h\u1EE3p th\xF4ng tin t\u1EEB internet v\u1EC1 ch\u1EE7 \u0111\u1EC1: "${topic}".
H\xE3y \u0111\u1ECDc c\xE1c b\xE0i vi\u1EBFt li\xEAn quan v\xE0 t\xF3m t\u1EAFt:
1. C\xE1c \u0111i\u1EC3m ch\xEDnh m\xE0 c\xE1c b\xE0i vi\u1EBFt hi\u1EC7n c\xF3 \u0111ang \u0111\u1EC1 c\u1EADp
2. S\u1ED1 li\u1EC7u th\u1ED1ng k\xEA ho\u1EB7c d\u1EEF li\u1EC7u th\u1EF1c t\u1EBF n\u1EBFu c\xF3
3. C\xE1c tips/m\u1EB9o ph\u1ED5 bi\u1EBFn nh\u1EA5t
4. Nh\u1EEFng g\xF3c nh\xECn ho\u1EB7c quan \u0111i\u1EC3m \u0111\xE1ng ch\xFA \xFD

Tr\u1EA3 v\u1EC1 b\u1EA3n t\xF3m t\u1EAFt nghi\xEAn c\u1EE9u chi ti\u1EBFt b\u1EB1ng ti\u1EBFng Vi\u1EC7t.`;
          const researchResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: researchPrompt }] }],
                tools: [{ google_search: {} }],
                generationConfig: { temperature: 0.3 }
              })
            }
          );
          if (researchResponse.ok) {
            await env.SMART_NOTE_KV.put(groundingKey, String(groundingCount + 1), {
              expirationTtl: 172800
            });
            const researchData = await researchResponse.json();
            researchContext = researchData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            const groundingMeta = researchData?.candidates?.[0]?.groundingMetadata;
            if (groundingMeta?.groundingChunks) {
              for (const chunk of groundingMeta.groundingChunks) {
                if (chunk?.web?.uri && chunk?.web?.title) {
                  groundingSources.push({
                    title: chunk.web.title,
                    url: chunk.web.uri
                  });
                }
              }
            }
            const seen = /* @__PURE__ */ new Set();
            groundingSources = groundingSources.filter((s) => {
              if (seen.has(s.url))
                return false;
              seen.add(s.url);
              return true;
            }).slice(0, 5);
            console.log(`[BlogGen] Research done: ${researchContext.length} chars, ${groundingSources.length} sources (quota: ${groundingCount + 1}/${GROUNDING_DAILY_LIMIT})`);
          } else {
            console.warn("[BlogGen] Grounding research failed, proceeding without research");
          }
        } catch (err) {
          console.warn("[BlogGen] Grounding error:", err.message);
        }
      } else {
        console.warn(`[BlogGen] \u26A0\uFE0F Grounding daily limit reached (${groundingCount}/${GROUNDING_DAILY_LIMIT}). Skipping web research to avoid charges.`);
      }
    }
    const systemPrompt = `B\u1EA1n l\xE0 m\u1ED9t chuy\xEAn gia vi\u1EBFt blog (Content Creator) c\u1EA5p cao v\u1EC1 \u0111a ch\u1EE7 \u0111\u1EC1 (C\xF4ng ngh\u1EC7, T\xE0i ch\xEDnh, \u0110\u1EDDi s\u1ED1ng GenZ).

${researchContext ? `## D\u1EEE LI\u1EC6U NGHI\xCAN C\u1EE8U T\u1EEA INTERNET
D\u01B0\u1EDBi \u0111\xE2y l\xE0 th\xF4ng tin \u0111\xE3 \u0111\u01B0\u1EE3c t\u1ED5ng h\u1EE3p t\u1EEB c\xE1c b\xE0i vi\u1EBFt th\u1EF1c t\u1EBF tr\xEAn internet. S\u1EED d\u1EE5ng d\u1EEF li\u1EC7u n\xE0y \u0111\u1EC3 l\xE0m gi\xE0u b\xE0i vi\u1EBFt, nh\u01B0ng PH\u1EA2I vi\u1EBFt l\u1EA1i b\u1EB1ng gi\u1ECDng v\u0103n ri\xEAng (KH\xD4NG copy nguy\xEAn v\u0103n):

${researchContext}

---` : ""}

## NHI\u1EC6M V\u1EE4
Vi\u1EBFt m\u1ED9t b\xE0i blog CH\u1EA4T L\u01AF\u1EE2NG CAO, chu\u1EA9n SEO v\u1EC1 ch\u1EE7 \u0111\u1EC1 \u0111\u01B0\u1EE3c y\xEAu c\u1EA7u.

## Y\xCAU C\u1EA6U CH\u1EA4T L\u01AF\u1EE2NG
1. **Human-like**: Vi\u1EBFt t\u1EF1 nhi\xEAn, c\xF3 c\u1EA3m x\xFAc, nh\u01B0 m\u1ED9t blogger chuy\xEAn nghi\u1EC7p th\u1EF1c th\u1EE5
2. **Data-driven**: S\u1EED d\u1EE5ng s\u1ED1 li\u1EC7u th\u1EF1c t\u1EBF t\u1EEB nghi\xEAn c\u1EE9u (n\u1EBFu c\xF3)
3. **Actionable**: M\u1ED7i m\u1EE5c ph\u1EA3i c\xF3 l\u1EDDi khuy\xEAn c\u1EE5 th\u1EC3, c\xF3 th\u1EC3 \xE1p d\u1EE5ng ngay
4. **SEO**: \u0110an xen keyword t\u1EF1 nhi\xEAn, heading structure r\xF5 r\xE0ng (H2/H3)
5. **FinNote**: Gi\u1EDBi thi\u1EC7u kh\xE9o l\xE9o app FinNote nh\u01B0 m\u1ED9t gi\u1EA3i ph\xE1p trong b\xE0i
6. **D\xE0i t\u1ED1i thi\u1EC3u 1500 t\u1EEB**: B\xE0i vi\u1EBFt ph\u1EA3i \u0111\u1EE7 s\xE2u v\xE0 chi ti\u1EBFt

Tr\u1EA3 v\u1EC1 \u0110\xDANG \u0111\u1ECBnh d\u1EA1ng JSON sau, kh\xF4ng k\xE8m b\u1EA5t k\u1EF3 text gi\u1EA3i th\xEDch n\xE0o kh\xE1c ngo\xE0i JSON:
{
  "title": "Ti\xEAu \u0111\u1EC1 h\u1EA5p d\u1EABn (d\u01B0\u1EDBi 60 k\xFD t\u1EF1)",
  "excerpt": "\u0110o\u1EA1n m\xF4 t\u1EA3 ng\u1EAFn (d\u01B0\u1EDBi 160 k\xFD t\u1EF1) cho SEO meta description",
  "tags": ["tag1", "tag2", "tag3"],
  "seoKeywords": "keyword1, keyword2, keyword3",
  "youtubeQuery": "t\u1EEB kh\xF3a t\xECm video YouTube li\xEAn quan (ti\u1EBFng Vi\u1EC7t, 3-5 t\u1EEB)",
  "content": "N\u1ED9i dung chi ti\u1EBFt b\u1EB1ng Markdown. KH\xD4NG bao g\u1ED3m H1. B\u1EAFt \u0111\u1EA7u v\u1EDBi \u0111o\u1EA1n m\u1EDF b\xE0i h\u1EA5p d\u1EABn, th\xE2n b\xE0i chia H2/H3 r\xF5 r\xE0ng, bullet points, bold text, blockquotes cho s\u1ED1 li\u1EC7u n\u1ED5i b\u1EADt, k\u1EBFt b\xE0i CTA gi\u1EDBi thi\u1EC7u FinNote.",
  "imagePrompts": ["M\xF4 t\u1EA3 ng\u1EAFn cho \u1EA3nh minh h\u1ECDa section 1", "M\xF4 t\u1EA3 cho \u1EA3nh section 2"]
}

QUY T\u1EAEC TAGS (B\u1EAET BU\u1ED8C):
- T\u1ED1i \u0111a 3 tags, vi\u1EBFt th\u01B0\u1EDDng, b\u1EB1ng ti\u1EBFng Vi\u1EC7t
- Ph\xF9 h\u1EE3p v\u1EDBi n\u1ED9i dung b\xE0i vi\u1EBFt (V\xED d\u1EE5: "c\xF4ng ngh\u1EC7", "genz", "t\xE0i ch\xEDnh", "xu h\u01B0\u1EDBng", "\u0111\u1EA7u t\u01B0")
- KH\xD4NG d\xF9ng t\xEAn th\u01B0\u01A1ng hi\u1EC7u (Google, Anthropic, Warren Buffett, v.v.)
- KH\xD4NG tr\xF9ng l\u1EB7p

${images.length > 0 ? `QUAN TR\u1ECCNG: Ng\u01B0\u1EDDi d\xF9ng \u0111\xE3 cung c\u1EA5p ${images.length} h\xECnh \u1EA3nh \u0111\xEDnh k\xE8m. B\u1EA1n C\xD3 TH\u1EC2 ch\xE8n ch\xFAng v\xE0o v\u1ECB tr\xED th\xEDch h\u1EE3p trong b\xE0i vi\u1EBFt Markdown b\u1EB1ng c\xFA ph\xE1p: [IMAGE_0], [IMAGE_1], v.v.` : ""}`;
    let text = "";
    if (useGemini) {
      try {
        const promptParts = [];
        if (topic)
          promptParts.push({ text: `Y\xEAu c\u1EA7u / Ch\u1EE7 \u0111\u1EC1: ${topic}` });
        images.forEach((img, idx) => {
          const match = img.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
          if (match) {
            promptParts.push({ inline_data: { mime_type: match[1], data: match[2] } });
          } else {
            promptParts.push({ inline_data: { mime_type: "image/jpeg", data: img } });
          }
          promptParts.push({ text: `\u0110\xE2y l\xE0 h\xECnh \u1EA3nh [IMAGE_${idx}].` });
        });
        if (promptParts.length === 0)
          promptParts.push({ text: "H\xE3y vi\u1EBFt 1 b\xE0i blog th\xFA v\u1ECB d\xE0nh cho GenZ." });
        console.log("[BlogGen] Phase 2: Generating content with Gemini...");
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: [{ parts: promptParts }],
              generationConfig: {
                temperature: 0.7,
                response_mime_type: "application/json"
              }
            })
          }
        );
        if (!response.ok) {
          const errObj = await response.json().catch(() => ({}));
          geminiError = errObj?.error?.message || `HTTP ${response.status}`;
          console.warn("[BlogGen] Gemini gen failed, falling back to CF AI:", geminiError);
          useGemini = false;
        } else {
          const data = await response.json();
          text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (!text) {
            geminiError = "Gemini returned empty response (possible safety filter)";
            console.warn("[BlogGen] Gemini returned empty text, falling back to CF AI");
            useGemini = false;
          }
        }
      } catch (geminiErr) {
        geminiError = geminiErr.message || "Gemini request failed";
        console.warn("[BlogGen] Gemini error, falling back to CF AI:", geminiError);
        useGemini = false;
      }
    }
    if (!useGemini || !text) {
      if (!env.AI)
        return errorResponse("AI binding not configured", 503);
      let extractedImageText = "";
      if (images.length > 0) {
        console.log(`[BlogGen] Extracting text from ${images.length} images using CF Vision...`);
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const match = img.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
          if (match) {
            try {
              const base64Data = match[2];
              const binaryString = atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let j = 0; j < binaryString.length; j++) {
                bytes[j] = binaryString.charCodeAt(j);
              }
              const visionRes = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
                image: [...bytes],
                prompt: "Tr\xEDch xu\u1EA5t to\xE0n b\u1ED9 v\u0103n b\u1EA3n v\xE0 m\xF4 t\u1EA3 n\u1ED9i dung trong h\xECnh \u1EA3nh n\xE0y. Ch\u1EC9 tr\u1EA3 v\u1EC1 v\u0103n b\u1EA3n h\u1EEFu \xEDch."
              });
              if (visionRes && visionRes.response) {
                extractedImageText += `
--- Chi ti\u1EBFt h\xECnh \u1EA3nh [IMAGE_${i}] ---
${visionRes.response}
`;
              }
            } catch (err) {
              console.warn("[BlogGen] CF Vision failed for image", i, err.message);
            }
          }
        }
      }
      const finalTopic = extractedImageText ? `Ch\u1EE7 \u0111\u1EC1 g\u1ED1c: ${topic}

D\u1EEF li\u1EC7u t\u1EEB h\xECnh \u1EA3nh \u0111\xEDnh k\xE8m:
${extractedImageText}` : topic;
      const metaPrompt = `B\u1EA1n l\xE0 chuy\xEAn gia SEO blog \u0111a ch\u1EE7 \u0111\u1EC1. Tr\u1EA3 v\u1EC1 \u0110\xDANG JSON (kh\xF4ng c\xF3 text th\xEAm):
{"title":"Ti\xEAu \u0111\u1EC1 h\u1EA5p d\u1EABn d\u01B0\u1EDBi 60 k\xFD t\u1EF1","excerpt":"M\xF4 t\u1EA3 SEO d\u01B0\u1EDBi 160 k\xFD t\u1EF1","tags":["tag1","tag2","tag3"],"seoKeywords":"keyword1, keyword2","imagePrompts":["m\xF4 t\u1EA3 \u1EA3nh 1","m\xF4 t\u1EA3 \u1EA3nh 2"]}`;
      const metaResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          { role: "system", content: metaPrompt },
          { role: "user", content: `Ch\u1EE7 \u0111\u1EC1: ${finalTopic}` }
        ],
        max_tokens: 512,
        temperature: 0.7
      });
      let metaText = metaResponse?.response || "";
      const metaMatch = metaText.match(/\{[\s\S]*\}/);
      if (metaMatch)
        metaText = metaMatch[0];
      let meta = {};
      try {
        meta = JSON.parse(metaText);
      } catch {
        meta = { title: finalTopic, excerpt: "", tags: [], seoKeywords: "", imagePrompts: [] };
      }
      const contentPrompt = `B\u1EA1n l\xE0 chuy\xEAn gia vi\u1EBFt blog \u0111a ch\u1EE7 \u0111\u1EC1. Vi\u1EBFt b\xE0i blog h\u1EA5p d\u1EABn b\u1EB1ng Markdown cho ch\u1EE7 \u0111\u1EC1 d\u01B0\u1EDBi \u0111\xE2y.
${researchContext ? `Th\xF4ng tin nghi\xEAn c\u1EE9u: ${researchContext.substring(0, 1500)}` : ""}
Y\xEAu c\u1EA7u: KH\xD4NG bao g\u1ED3m ti\xEAu \u0111\u1EC1 H1. B\u1EAFt \u0111\u1EA7u tr\u1EF1c ti\u1EBFp v\u1EDBi \u0111o\u1EA1n m\u1EDF b\xE0i, th\xE2n b\xE0i chia H2/H3, bullet points, bold text, k\u1EBFt b\xE0i CTA gi\u1EDBi thi\u1EC7u FinNote.
${images.length > 0 ? `QUAN TR\u1ECCNG: H\xE3y ch\xE8n c\xE1c h\xECnh \u1EA3nh g\u1ED1c v\xE0o b\xE0i vi\u1EBFt t\u1EA1i c\xE1c v\u1ECB tr\xED ph\xF9 h\u1EE3p b\u1EB1ng c\xFA ph\xE1p: [IMAGE_0], [IMAGE_1], v.v.` : ""}
Vi\u1EBFt t\u1ED1i thi\u1EC3u 1500 t\u1EEB, chi ti\u1EBFt v\xE0 chuy\xEAn s\xE2u.
Ch\u1EC9 tr\u1EA3 v\u1EC1 n\u1ED9i dung Markdown, kh\xF4ng b\u1ECDc trong JSON hay code block.`;
      const contentResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          { role: "system", content: contentPrompt },
          { role: "user", content: `Ti\xEAu \u0111\u1EC1: ${meta.title || finalTopic}
Ch\u1EE7 \u0111\u1EC1: ${finalTopic}` }
        ],
        max_tokens: 4096,
        temperature: 0.7
      });
      const blogContent = stripLeadingH1(contentResponse?.response || "");
      return jsonResponse({
        success: true,
        data: {
          title: meta.title || topic,
          excerpt: meta.excerpt || "",
          tags: meta.tags || [],
          seoKeywords: meta.seoKeywords || "",
          content: blogContent,
          imagePrompts: meta.imagePrompts || [],
          groundingSources,
          modelUsed: "cloudflare",
          geminiError
        }
      });
    }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch)
      text = jsonMatch[0];
    if (!text) {
      return errorResponse("AI returned empty response. Please try again.", 500);
    }
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error("[BlogGen] JSON parse failed, text snippet:", text.substring(0, 200));
      return errorResponse("Failed to parse AI response. Please try again or switch to Cloudflare AI model.", 500);
    }
    if (result.content) {
      result.content = stripLeadingH1(result.content);
    }
    result.groundingSources = groundingSources;
    result.modelUsed = "gemini";
    console.log(`[BlogGen] Done: "${result.title}", ${result.content?.length || 0} chars, ${groundingSources.length} sources, ${result.imagePrompts?.length || 0} image prompts`);
    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return errorResponse(err.message || "AI request failed", 500);
  }
}
__name(handleGenerateBlogContent, "handleGenerateBlogContent");
async function handleRefineBlogContent(userId, request, env) {
  if (!await isAdmin(userId, env))
    return errorResponse("Forbidden", 403);
  const url = new URL(request.url);
  const forceCloudflare = url.searchParams.get("model") === "cf";
  const draftData = await request.json();
  if (!draftData || !draftData.content)
    return errorResponse("Missing draft content", 400);
  const systemPrompt = `B\u1EA1n l\xE0 m\u1ED9t T\u1ED5ng bi\xEAn t\u1EADp Blog \u0111a ch\u1EE7 \u0111\u1EC1 c\u1EA5p cao (Senior Content Editor).
Nhi\u1EC7m v\u1EE5 c\u1EE7a b\u1EA1n l\xE0 \u0111\u1ECDc v\xE0 tinh ch\u1EC9nh (refine) b\xE0i blog nh\xE1p \u0111\u01B0\u1EE3c cung c\u1EA5p. B\u1EA1n PH\u1EA2I:
1. Vi\u1EBFt l\u1EA1i b\xE0i vi\u1EBFt sao cho t\u1EF1 nhi\xEAn, gi\u1ED1ng con ng\u01B0\u1EDDi nh\u1EA5t (human-like style).
2. S\u1EEDa to\xE0n b\u1ED9 c\xE1c l\u1ED7i pha tr\u1ED9n ng\xF4n ng\u1EEF ng\u1EDB ng\u1EA9n (v\xED d\u1EE5: "t\xE0i ch\xEDnhallenging", "qu\u1EA3n l\xFD cost", v.v.).
3. B\u1ED5 sung c\xE1c v\xED d\u1EE5 th\u1EF1c t\u1EBF (real-world examples) \u0111\u1EC3 ng\u01B0\u1EDDi \u0111\u1ECDc d\u1EC5 h\xECnh dung.
4. B\u1ED5 sung m\u1ED9t checklist h\xE0nh \u0111\u1ED9ng c\u1EE5 th\u1EC3 ho\u1EB7c gi\u1EA3i ph\xE1p r\xF5 r\xE0ng (actionable advice) cho ng\u01B0\u1EDDi d\xF9ng.
5. Gi\u1EEF nguy\xEAn ho\u1EB7c t\u1ED1i \u01B0u l\u1EA1i title, excerpt, tags, seoKeywords cho chu\u1EA9n SEO.
Tr\u1EA3 v\u1EC1 \u0110\xDANG \u0111\u1ECBnh d\u1EA1ng JSON sau, kh\xF4ng k\xE8m b\u1EA5t k\u1EF3 text gi\u1EA3i th\xEDch n\xE0o kh\xE1c ngo\xE0i JSON:
{
  "title": "Ti\xEAu \u0111\u1EC1 h\u1EA5p d\u1EABn (d\u01B0\u1EDBi 60 k\xFD t\u1EF1)",
  "excerpt": "\u0110o\u1EA1n m\xF4 t\u1EA3 ng\u1EAFn (d\u01B0\u1EDBi 160 k\xFD t\u1EF1) cho SEO meta description",
  "tags": ["tag1", "tag2", "tag3"],
  "seoKeywords": "keyword1, keyword2",
  "content": "N\u1ED9i dung b\xE0i vi\u1EBFt chi ti\u1EBFt \u0111\u01B0\u1EE3c format b\u1EB1ng Markdown (kh\xF4ng ch\u1EE9a H1 \u0111\u1EA7u b\xE0i). \u0110\u1EA3m b\u1EA3o n\u1ED9i dung s\u1EAFc s\u1EA3o, t\u1EF1 nhi\xEAn, c\xF3 checklist v\xE0 v\xED d\u1EE5 th\u1EF1c t\u1EBF."
}

QUY T\u1EAEC TAGS: T\u1ED1i \u0111a 3 tags, vi\u1EBFt th\u01B0\u1EDDng, ti\u1EBFng Vi\u1EC7t, ph\xF9 h\u1EE3p n\u1ED9i dung. KH\xD4NG t\xEAn th\u01B0\u01A1ng hi\u1EC7u. KH\xD4NG tr\xF9ng l\u1EB7p.`;
  try {
    let stripLeadingH12 = function(md) {
      return md.replace(/^\s*#\s+[^\n]+\n*/m, "").trim();
    };
    var stripLeadingH1 = stripLeadingH12;
    __name(stripLeadingH12, "stripLeadingH1");
    let text = "";
    let useGemini = !!env.GEMINI_API_KEY && !forceCloudflare;
    let geminiError;
    if (useGemini) {
      try {
        const promptParts = [
          { text: `\u0110\xE2y l\xE0 b\u1EA3n nh\xE1p c\u1EA7n tinh ch\u1EC9nh:

Title: ${draftData.title}
Excerpt: ${draftData.excerpt}
Content:
${draftData.content}` }
        ];
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemPrompt }]
              },
              contents: [{
                parts: promptParts
              }],
              generationConfig: {
                temperature: 0.5,
                // lower temp for editor consistency
                response_mime_type: "application/json"
              }
            })
          }
        );
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          geminiError = errData?.error?.message || `HTTP ${response.status}`;
          console.warn("[BlogRefine] Gemini failed, falling back to CF AI:", geminiError);
          useGemini = false;
        } else {
          const data = await response.json();
          text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (!text) {
            geminiError = "Gemini refine returned empty response (possible safety filter)";
            console.warn("[BlogRefine] Gemini returned empty text, falling back to CF AI");
            useGemini = false;
          }
        }
      } catch (e) {
        geminiError = e.message || "Gemini request failed";
        console.warn("[BlogRefine] Gemini error, falling back:", geminiError);
        useGemini = false;
      }
    }
    if (!useGemini || !text) {
      let stripH12 = function(md) {
        return md.replace(/^\s*#\s+[^\n]+\n*/m, "").trim();
      };
      var stripH1 = stripH12;
      __name(stripH12, "stripH1");
      if (!env.AI)
        return errorResponse("AI binding not configured", 503);
      const metaOnlyPrompt = `B\u1EA1n l\xE0 SEO editor. T\u1ED1i \u01B0u c\xE1c tr\u01B0\u1EDDng sau cho chu\u1EA9n SEO, tr\u1EA3 v\u1EC1 JSON thu\u1EA7n (kh\xF4ng text kh\xE1c):
{"title":"Ti\xEAu \u0111\u1EC1 t\u1ED1i \u01B0u d\u01B0\u1EDBi 60 k\xFD t\u1EF1","excerpt":"M\xF4 t\u1EA3 SEO d\u01B0\u1EDBi 160 k\xFD t\u1EF1","tags":["tag1","tag2","tag3"],"seoKeywords":"keyword1, keyword2, keyword3"}`;
      let refinedMeta = {
        title: draftData.title || "",
        excerpt: draftData.excerpt || "",
        tags: draftData.tags || [],
        seoKeywords: draftData.seoKeywords || ""
      };
      try {
        const metaRes = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [
            { role: "system", content: metaOnlyPrompt },
            { role: "user", content: `Title: ${draftData.title}
Excerpt: ${draftData.excerpt}
Tags: ${(draftData.tags || []).join(", ")}
Keywords: ${draftData.seoKeywords || ""}` }
          ],
          max_tokens: 400,
          temperature: 0.3
        });
        const metaRaw = metaRes?.response || "";
        const metaMatch = metaRaw.match(/\{[\s\S]*\}/);
        if (metaMatch) {
          try {
            refinedMeta = { ...refinedMeta, ...JSON.parse(metaMatch[0]) };
          } catch {
          }
        }
      } catch {
      }
      const contentPolishPrompt = `B\u1EA1n l\xE0 editor vi\u1EBFt blog chuy\xEAn nghi\u1EC7p. H\xE3y c\u1EA3i thi\u1EC7n b\xE0i vi\u1EBFt sau:
- S\u1EEDa l\u1ED7i pha tr\u1ED9n ng\xF4n ng\u1EEF (vd: "t\xE0i ch\xEDnhallenging" \u2192 "t\xE0i ch\xEDnh th\xE1ch th\u1EE9c")
- Th\xEAm 1-2 v\xED d\u1EE5 th\u1EF1c t\u1EBF n\u1EBFu thi\u1EBFu
- KH\xD4NG thay \u0111\u1ED5i c\u1EA5u tr\xFAc heading/markdown
- KH\xD4NG b\u1ECDc trong JSON hay code block
- Tr\u1EA3 v\u1EC1 n\u1ED9i dung Markdown tr\u1EF1c ti\u1EBFp`;
      let refinedContent = draftData.content || "";
      if (refinedContent.length < 8e3) {
        try {
          const contentTruncated = refinedContent.substring(0, 4e3);
          const contentRes = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [
              { role: "system", content: contentPolishPrompt },
              { role: "user", content: contentTruncated }
            ],
            max_tokens: 4096,
            temperature: 0.4
          });
          const polished = contentRes?.response || "";
          if (polished.length > 200) {
            refinedContent = polished;
          }
        } catch {
        }
      }
      const cfResult = {
        title: refinedMeta.title || draftData.title,
        excerpt: refinedMeta.excerpt || draftData.excerpt,
        tags: Array.isArray(refinedMeta.tags) ? refinedMeta.tags : draftData.tags || [],
        seoKeywords: refinedMeta.seoKeywords || draftData.seoKeywords || "",
        content: refinedContent,
        modelUsed: "cloudflare",
        geminiError
      };
      if (cfResult.content)
        cfResult.content = stripH12(cfResult.content);
      console.log(`[BlogRefine] CF AI done: "${cfResult.title}", ${cfResult.content.length} chars`);
      return jsonResponse({ success: true, data: cfResult });
    }
    if (!text) {
      if (!geminiError)
        geminiError = "Gemini refine returned empty response";
      console.warn("[BlogRefine] Gemini empty text, using draft as-is");
      return jsonResponse({
        success: true,
        data: { ...draftData, modelUsed: "cloudflare", geminiError }
      });
    }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch)
      text = jsonMatch[0];
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error("[BlogRefine] Gemini JSON parse failed, returning original draft");
      return jsonResponse({
        success: true,
        data: {
          ...draftData,
          modelUsed: "cloudflare",
          geminiError: "Gemini response parse failed, using original draft"
        }
      });
    }
    if (result.content) {
      result.content = stripLeadingH12(result.content);
    }
    result.modelUsed = !forceCloudflare && env.GEMINI_API_KEY && !geminiError ? "gemini" : "cloudflare";
    if (geminiError)
      result.geminiError = geminiError;
    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return errorResponse(err.message || "AI request failed", 500);
  }
}
__name(handleRefineBlogContent, "handleRefineBlogContent");
async function handleGenerateBlogImage(userId, request, env) {
  if (!await isAdmin(userId, env))
    return errorResponse("Forbidden", 403);
  if (!env.AI)
    return errorResponse("AI binding not configured", 503);
  const { prompt } = await request.json();
  if (!prompt)
    return errorResponse("Missing prompt", 400);
  const optimizedPrompt = `A premium, modern illustration for a blog: ${prompt}. Style: clean gradient background, minimal flat design, professional theme, vivid accent colors, editorial quality.`;
  try {
    const response = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
      prompt: optimizedPrompt,
      num_steps: 4
    });
    const responseType = typeof response;
    const isStream = response instanceof ReadableStream;
    const isBuffer = response instanceof ArrayBuffer;
    const hasImage = response?.image !== void 0;
    const imageType = hasImage ? typeof response.image : "N/A";
    console.log(`[BlogImage] AI response \u2014 type: ${responseType}, isStream: ${isStream}, isBuffer: ${isBuffer}, hasImage: ${hasImage}, imageType: ${imageType}`);
    let imageBytes;
    if (hasImage && typeof response.image === "string" && response.image.length > 100) {
      const binaryString = atob(response.image);
      imageBytes = Uint8Array.from(binaryString, (m) => m.codePointAt(0));
      console.log(`[BlogImage] Decoded base64 image: ${imageBytes.length} bytes`);
    } else if (isStream) {
      const arrayBuffer = await new Response(response).arrayBuffer();
      imageBytes = new Uint8Array(arrayBuffer);
      console.log(`[BlogImage] Read stream image: ${imageBytes.length} bytes`);
    } else if (isBuffer) {
      imageBytes = new Uint8Array(response);
      console.log(`[BlogImage] ArrayBuffer image: ${imageBytes.length} bytes`);
    } else {
      const debugStr = JSON.stringify(response)?.substring(0, 300) || String(response);
      console.error(`[BlogImage] UNEXPECTED response format: ${debugStr}`);
      return errorResponse(`Unexpected AI response format (type: ${responseType})`, 500);
    }
    if (imageBytes.length < 1e3) {
      console.error(`[BlogImage] Image too small: ${imageBytes.length} bytes`);
      return errorResponse("AI generated invalid image (too small)", 500);
    }
    const magicOk = imageBytes[0] === 255 && imageBytes[1] === 216 || // JPEG
    imageBytes[0] === 137 && imageBytes[1] === 80 || // PNG
    imageBytes[0] === 82 && imageBytes[1] === 73 || // RIFF (WebP)
    imageBytes[0] === 71 && imageBytes[1] === 73;
    if (!magicOk) {
      console.error(`[BlogImage] Invalid magic bytes: [${imageBytes[0]}, ${imageBytes[1]}, ${imageBytes[2]}, ${imageBytes[3]}]`);
    }
    let contentType = "image/jpeg";
    if (imageBytes[0] === 137 && imageBytes[1] === 80)
      contentType = "image/png";
    else if (imageBytes[0] === 82 && imageBytes[1] === 73)
      contentType = "image/webp";
    const imageId = generateId();
    await env.SMART_NOTE_KV.put(`public/images/${imageId}`, imageBytes, {
      metadata: { contentType }
    });
    console.log(`[BlogImage] Stored image ${imageId}: ${imageBytes.length} bytes, ${contentType}`);
    const host = new URL(request.url).origin;
    const imageUrl = `${host}/api/images/${imageId}`;
    return jsonResponse({ success: true, data: { imageUrl } });
  } catch (err) {
    console.error(`[BlogImage] Generation error:`, err.message, err.stack);
    return errorResponse(err.message || "Image generation failed", 500);
  }
}
__name(handleGenerateBlogImage, "handleGenerateBlogImage");
async function handleUploadImage(userId, request, env) {
  if (!await isAdmin(userId, env))
    return errorResponse("Forbidden", 403);
  const { image } = await request.json();
  if (!image)
    return errorResponse("Missing image data", 400);
  try {
    let base64Data = image;
    let contentType = "image/jpeg";
    const dataUrlMatch = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (dataUrlMatch) {
      contentType = dataUrlMatch[1];
      base64Data = dataUrlMatch[2];
    }
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    if (bytes.length < 100) {
      return errorResponse("Image data too small", 400);
    }
    const imageId = generateId();
    await env.SMART_NOTE_KV.put(`public/images/${imageId}`, bytes, {
      metadata: { contentType }
    });
    const host = new URL(request.url).origin;
    const imageUrl = `${host}/api/images/${imageId}`;
    return jsonResponse({ success: true, data: { imageUrl } });
  } catch (err) {
    return errorResponse(err.message || "Image upload failed", 500);
  }
}
__name(handleUploadImage, "handleUploadImage");

// src/controllers/proxy.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function handleProxyLocation(request) {
  const cf = request.cf;
  if (cf && cf.latitude && cf.longitude) {
    let city = cf.city || "V\u1ECB tr\xED c\u1EE7a b\u1EA1n";
    if (city.includes("Ho Chi Minh") || city === "Th\xE0nh ph\u1ED1 H\u1ED3 Ch\xED Minh" || city === "TP.HCM" || city.includes("TP. HCM"))
      city = "Ho Chi Minh City";
    if (city.includes("Ha Noi") || city === "Hanoi")
      city = "H\xE0 N\u1ED9i";
    if (city.includes("Da Nang") || city === "Danang")
      city = "\u0110\xE0 N\u1EB5ng";
    return jsonResponse({
      success: true,
      data: {
        lat: parseFloat(cf.latitude),
        lon: parseFloat(cf.longitude),
        city,
        country: cf.country || ""
      }
    });
  }
  try {
    const res = await fetch(FREE_IP_API);
    const data = await res.json();
    if (data && data.latitude && data.longitude) {
      let city = data.cityName || "V\u1ECB tr\xED c\u1EE7a b\u1EA1n";
      if (city.includes("Ho Chi Minh") || city === "Th\xE0nh ph\u1ED1 H\u1ED3 Ch\xED Minh" || city === "TP.HCM" || city.includes("TP. HCM"))
        city = "Ho Chi Minh City";
      if (city.includes("Ha Noi") || city === "Hanoi")
        city = "H\xE0 N\u1ED9i";
      if (city.includes("Da Nang") || city === "Danang")
        city = "\u0110\xE0 N\u1EB5ng";
      return jsonResponse({
        success: true,
        data: {
          lat: data.latitude,
          lon: data.longitude,
          city,
          country: data.countryName || ""
        }
      });
    }
  } catch (err) {
  }
  return jsonResponse({
    success: true,
    data: {
      lat: 10.8231,
      lon: 106.6297,
      city: "Ho Chi Minh City",
      country: "Vi\u1EC7t Nam"
    }
  });
}
__name(handleProxyLocation, "handleProxyLocation");
async function handleProxyWeather(request) {
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");
  if (!lat || !lon) {
    return errorResponse("Missing lat and lon query parameters", 400);
  }
  try {
    const [weatherRes, aqiRes] = await Promise.allSettled([
      fetch(
        `${OPEN_METEO_FORECAST_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,uv_index&timezone=auto`
      ),
      fetch(
        `${OPEN_METEO_AQI_API}?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5&timezone=auto`
      )
    ]);
    if (weatherRes.status === "rejected") {
      return errorResponse(`Weather proxy failed: ${weatherRes.reason?.message || weatherRes.reason}`, 502);
    }
    if (weatherRes.status === "fulfilled" && !weatherRes.value.ok) {
      return errorResponse(`Open-Meteo returned HTTP ${weatherRes.value.status}`, 502);
    }
    let weatherData = null;
    let aqiData = null;
    if (weatherRes.status === "fulfilled") {
      weatherData = await weatherRes.value.json();
    }
    if (aqiRes.status === "fulfilled" && aqiRes.value.ok) {
      aqiData = await aqiRes.value.json();
    }
    return jsonResponse({
      success: true,
      data: {
        weather: weatherData,
        aqi: aqiData
      }
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
__name(handleProxyWeather, "handleProxyWeather");
async function handleProxyExchangeRate(request) {
  try {
    const res = await fetch(EXCHANGERATE_API, {
      headers: {
        "User-Agent": "Cloudflare-Worker"
      }
    });
    if (!res.ok) {
      return errorResponse(`Exchange rate API HTTP ${res.status}`, 502);
    }
    const data = await res.json();
    const vndRate = data?.rates?.VND;
    if (!vndRate) {
      return errorResponse("Failed to parse exchange rate", 500);
    }
    const usdPerVnd = 1 / vndRate;
    return jsonResponse({
      success: true,
      data: {
        vnd: { usd: usdPerVnd }
      }
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
__name(handleProxyExchangeRate, "handleProxyExchangeRate");
async function handleProxyStockPrice(request, env) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol")?.toUpperCase();
  if (!symbol) {
    return errorResponse("Missing symbol query parameter", 400);
  }
  const cacheKey = `public/stocks/${symbol}`;
  const now = Date.now();
  try {
    const cachedStr = await env.SMART_NOTE_KV.get(cacheKey);
    if (cachedStr) {
      const cached = JSON.parse(cachedStr);
      if (now - cached.timestamp < 5 * 60 * 1e3) {
        return jsonResponse({ success: true, data: { currentPrice: cached.price, symbol } });
      }
    }
    const to = Math.floor(now / 1e3);
    const from = to - 86400 * 15;
    const res = await fetch(`${ENTRADE_CHART_API}?from=${from}&to=${to}&symbol=${symbol}&resolution=1D`);
    if (!res.ok) {
      return errorResponse(`DNSE API HTTP ${res.status}`, 502);
    }
    const data = await res.json();
    if (!data || !data.c || data.c.length === 0) {
      return errorResponse("Symbol not found or no data", 404);
    }
    const currentPrice = data.c[data.c.length - 1];
    await env.SMART_NOTE_KV.put(cacheKey, JSON.stringify({ price: currentPrice, timestamp: now }), { expirationTtl: 3600 });
    return jsonResponse({
      success: true,
      data: { currentPrice, symbol }
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
__name(handleProxyStockPrice, "handleProxyStockPrice");
async function handleProxyStockHistory(request, env) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol")?.toUpperCase();
  const days = parseInt(url.searchParams.get("days") || "7", 10);
  if (!symbol) {
    return errorResponse("Missing symbol query parameter", 400);
  }
  const cacheKey = `public/stocks/history/${symbol}/${days}`;
  const now = Date.now();
  try {
    const cachedStr = await env.SMART_NOTE_KV.get(cacheKey);
    if (cachedStr) {
      const cached = JSON.parse(cachedStr);
      if (now - cached.timestamp < 30 * 60 * 1e3) {
        return jsonResponse({ success: true, data: { history: cached.history, symbol } });
      }
    }
    const to = Math.floor(now / 1e3);
    const from = to - 86400 * (days + 4);
    const res = await fetch(`${ENTRADE_CHART_API}?from=${from}&to=${to}&symbol=${symbol}&resolution=1D`);
    if (!res.ok) {
      return errorResponse(`DNSE API HTTP ${res.status}`, 502);
    }
    const data = await res.json();
    if (!data || !data.c || data.c.length === 0) {
      return errorResponse("Symbol not found or no data", 404);
    }
    const closes = data.c.slice(-days);
    const opens = data.o?.slice(-days) || closes;
    const highs = data.h?.slice(-days) || closes;
    const lows = data.l?.slice(-days) || closes;
    const volumes = data.v?.slice(-days) || [];
    const timestamps = data.t.slice(-days);
    const history = closes.map((price, i) => ({
      price,
      open: opens[i],
      high: highs[i],
      low: lows[i],
      volume: volumes[i],
      time: timestamps[i] * 1e3
    }));
    await env.SMART_NOTE_KV.put(cacheKey, JSON.stringify({ history, timestamp: now }), { expirationTtl: 3600 });
    return jsonResponse({
      success: true,
      data: { history, symbol }
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
__name(handleProxyStockHistory, "handleProxyStockHistory");
async function handleProxyLogo(request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol")?.toUpperCase();
  if (!symbol) {
    return new Response("Missing symbol", { status: 400 });
  }
  const urls2 = [
    `https://cdn.simplize.vn/simplizevn/logo/${symbol}.jpeg`,
    `https://fiin-fundamental.ssi.com.vn/StockTicker/GetTickerImage?code=${symbol}`,
    `https://tcdn.tcbs.com.vn/avatar/a/${symbol}.png`,
    `https://image.simplize.vn/logo/${symbol.toLowerCase()}.jpeg`
  ];
  for (const fetchUrl of urls2) {
    try {
      const res = await fetch(fetchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://iboard.ssi.com.vn/",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
      });
      if (res.ok) {
        const headers = new Headers();
        headers.set("Content-Type", res.headers.get("content-type") || "image/png");
        headers.set("Cache-Control", "public, max-age=864000");
        headers.set("Access-Control-Allow-Origin", "*");
        return new Response(res.body, { status: 200, headers });
      }
    } catch (e) {
    }
  }
  return new Response("Not found", { status: 404 });
}
__name(handleProxyLogo, "handleProxyLogo");
var FMARKET_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Origin": "https://fmarket.vn",
  "Referer": "https://fmarket.vn/"
};
async function handleProxyFundNav(request, env) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol")?.toUpperCase();
  if (!symbol)
    return errorResponse("Missing symbol", 400);
  const cacheKey = `public/funds/nav/${symbol}`;
  const now = Date.now();
  try {
    const cached = await env.SMART_NOTE_KV.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (now - parsed.timestamp < 4 * 60 * 60 * 1e3) {
        return jsonResponse({ success: true, data: { nav: parsed.nav, symbol } });
      }
    }
    const res = await fetch(`${FMARKET_API_BASE}/products/filter`, {
      method: "POST",
      headers: FMARKET_HEADERS,
      body: JSON.stringify({
        types: ["NEW_FUND", "TRADING_FUND"],
        issuerIds: [],
        sortOrder: "DESC",
        sortField: "navTo6Months",
        page: 1,
        pageSize: 10,
        isIpo: false,
        fundAssetTypes: [],
        bondRemainPeriods: [],
        searchField: symbol,
        isBuyByReward: false,
        thirdAppIds: []
      })
    });
    if (!res.ok)
      return errorResponse(`Fmarket API HTTP ${res.status}`, 502);
    const data = await res.json();
    const fund = data?.data?.rows?.find(
      (f) => f.shortName?.toUpperCase() === symbol || f.name?.toUpperCase().includes(symbol)
    );
    if (!fund)
      return errorResponse("Fund not found", 404);
    const nav = fund.nav || fund.navCurrent || 0;
    await env.SMART_NOTE_KV.put(cacheKey, JSON.stringify({ nav, timestamp: now }), { expirationTtl: 14400 });
    return jsonResponse({ success: true, data: { nav, symbol, fundName: fund.name, productId: fund.id } });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
__name(handleProxyFundNav, "handleProxyFundNav");
async function handleProxyFundHistory(request, env) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol")?.toUpperCase();
  const days = parseInt(url.searchParams.get("days") || "7", 10);
  const productIdParam = url.searchParams.get("productId");
  if (!symbol)
    return errorResponse("Missing symbol", 400);
  const cacheKey = `public/funds/history/${symbol}/${days}`;
  const now = Date.now();
  try {
    const cached = await env.SMART_NOTE_KV.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (now - parsed.timestamp < 6 * 60 * 60 * 1e3) {
        return jsonResponse({ success: true, data: { history: parsed.history, symbol } });
      }
    }
    let productId = productIdParam ? parseInt(productIdParam, 10) : null;
    if (!productId) {
      const searchRes = await fetch(`${FMARKET_API_BASE}/products/filter`, {
        method: "POST",
        headers: FMARKET_HEADERS,
        body: JSON.stringify({
          types: ["NEW_FUND", "TRADING_FUND"],
          issuerIds: [],
          sortOrder: "DESC",
          sortField: "navTo6Months",
          page: 1,
          pageSize: 5,
          isIpo: false,
          fundAssetTypes: [],
          bondRemainPeriods: [],
          searchField: symbol,
          isBuyByReward: false,
          thirdAppIds: []
        })
      });
      if (searchRes.ok) {
        const sData = await searchRes.json();
        const found = sData?.data?.rows?.find((f) => f.shortName?.toUpperCase() === symbol);
        productId = found?.id || null;
      }
    }
    if (!productId)
      return errorResponse("Cannot find fund productId", 404);
    const toDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0].replace(/-/g, "");
    const fromDate = new Date(Date.now() - days * 3 * 86400 * 1e3).toISOString().split("T")[0].replace(/-/g, "");
    const histRes = await fetch(`${FMARKET_API_BASE}/product/get-nav-history`, {
      method: "POST",
      headers: FMARKET_HEADERS,
      body: JSON.stringify({ isAllData: 0, productId, fromDate, toDate })
    });
    if (!histRes.ok)
      return errorResponse(`Fmarket history API HTTP ${histRes.status}`, 502);
    const histData = await histRes.json();
    const rows = histData?.data?.navHistories || histData?.data || [];
    const history = rows.slice(-days).map((row) => ({
      nav: row.nav || row.navCurrent || 0,
      time: new Date(row.navDate || row.date || row.time).getTime()
    })).filter((h) => h.nav > 0);
    await env.SMART_NOTE_KV.put(cacheKey, JSON.stringify({ history, timestamp: now }), { expirationTtl: 21600 });
    return jsonResponse({ success: true, data: { history, symbol } });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
__name(handleProxyFundHistory, "handleProxyFundHistory");
async function handleProxyFundList(request, env) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();
  const cacheKey = `public/funds/list/${query.toUpperCase()}`;
  const now = Date.now();
  try {
    const cached = await env.SMART_NOTE_KV.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (now - parsed.timestamp < 24 * 60 * 60 * 1e3) {
        return jsonResponse({ success: true, data: { funds: parsed.funds } });
      }
    }
    const res = await fetch(`${FMARKET_API_BASE}/products/filter`, {
      method: "POST",
      headers: FMARKET_HEADERS,
      body: JSON.stringify({
        types: ["NEW_FUND", "TRADING_FUND"],
        issuerIds: [],
        sortOrder: "DESC",
        sortField: "navTo6Months",
        page: 1,
        pageSize: 50,
        isIpo: false,
        fundAssetTypes: [],
        bondRemainPeriods: [],
        searchField: query,
        isBuyByReward: false,
        thirdAppIds: []
      })
    });
    if (!res.ok)
      return errorResponse(`Fmarket API HTTP ${res.status}`, 502);
    const data = await res.json();
    const funds = (data?.data?.rows || []).map((f) => ({
      symbol: f.shortName || "",
      name: f.name || "",
      type: f.type || "",
      productId: f.id || 0,
      nav: f.nav || f.navCurrent || 0,
      issuer: f.managementFee?.name || ""
    }));
    await env.SMART_NOTE_KV.put(cacheKey, JSON.stringify({ funds, timestamp: now }), { expirationTtl: 86400 });
    return jsonResponse({ success: true, data: { funds } });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
__name(handleProxyFundList, "handleProxyFundList");

// src/controllers/stock.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/services/stock-alert.service.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var PRICE_CACHE_TTL = 6e4;
var ALERT_USERS_KEY = "public/stock-alert-users";
async function registerAlertUser(userId, env) {
  const users = await getJSON(env.SMART_NOTE_KV, ALERT_USERS_KEY) || [];
  if (!users.includes(userId)) {
    users.push(userId);
    await putJSON(env.SMART_NOTE_KV, ALERT_USERS_KEY, users);
  }
}
__name(registerAlertUser, "registerAlertUser");
async function unregisterAlertUserIfEmpty(userId, env) {
  const stocks = await getJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`) || [];
  const hasAlerts = stocks.some((s) => s.alerts && s.alerts.some((a) => !a.triggered));
  const hasThresholds = stocks.some((s) => s.targetProfit || s.stopLoss);
  if (!hasAlerts && !hasThresholds) {
    const users = await getJSON(env.SMART_NOTE_KV, ALERT_USERS_KEY) || [];
    const filtered = users.filter((u) => u !== userId);
    await putJSON(env.SMART_NOTE_KV, ALERT_USERS_KEY, filtered);
  }
}
__name(unregisterAlertUserIfEmpty, "unregisterAlertUserIfEmpty");
var priceCache = /* @__PURE__ */ new Map();
async function getCurrentPrice(symbol, env) {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.ts < PRICE_CACHE_TTL) {
    return cached.price;
  }
  try {
    const kvKey = `public/stocks/${symbol}`;
    const kvCached = await env.SMART_NOTE_KV.get(kvKey);
    if (kvCached) {
      const parsed = JSON.parse(kvCached);
      if (Date.now() - parsed.timestamp < PRICE_CACHE_TTL) {
        priceCache.set(symbol, { price: parsed.price, ts: Date.now() });
        return parsed.price;
      }
    }
    const now = Math.floor(Date.now() / 1e3);
    const from = now - 86400 * 5;
    const res = await fetch(
      `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${from}&to=${now}&symbol=${symbol}&resolution=1D`
    );
    if (!res.ok)
      return null;
    const data = await res.json();
    if (!data?.c?.length)
      return null;
    const price = data.c[data.c.length - 1];
    priceCache.set(symbol, { price, ts: Date.now() });
    await env.SMART_NOTE_KV.put(kvKey, JSON.stringify({ price, timestamp: Date.now() }), { expirationTtl: 3600 });
    return price;
  } catch {
    return null;
  }
}
__name(getCurrentPrice, "getCurrentPrice");
async function checkAllStockAlerts(env) {
  const userIds = await getJSON(env.SMART_NOTE_KV, ALERT_USERS_KEY) || [];
  if (userIds.length === 0)
    return "No users with alerts";
  let totalTriggered = 0;
  for (const userId of userIds) {
    try {
      const stocks = await getJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`) || [];
      let modified = false;
      for (const stock of stocks) {
        const currentPrice = await getCurrentPrice(stock.symbol, env);
        if (currentPrice === null)
          continue;
        if (stock.alerts?.length) {
          const pendingAlerts = stock.alerts;
          for (const alert of pendingAlerts) {
            let shouldTrigger = false;
            if (alert.direction === "above" && currentPrice >= alert.targetPrice * 0.98) {
              shouldTrigger = true;
            } else if (alert.direction === "below" && currentPrice <= alert.targetPrice * 1.02) {
              shouldTrigger = true;
            }
            if (shouldTrigger) {
              alert.triggered = true;
              alert.notifiedAt = (/* @__PURE__ */ new Date()).toISOString();
              modified = true;
              totalTriggered++;
              const isBuy = alert.direction === "below";
              const action = isBuy ? "\u{1F4C9} MUA" : "\u{1F4C8} B\xC1N";
              const title = `\u{1F4CA} ${stock.symbol} \u0111\xE3 v\xE0o v\xF9ng gi\xE1 ${action}!`;
              const body = `Gi\xE1 hi\u1EC7n t\u1EA1i: ${currentPrice} (M\u1ED1c ${alert.targetPrice}) \u2014 \u0110\xE3 ti\u1EC7m c\u1EADn bi\xEAn \u0111\u1ED9 \xB12% \u0111\u1EC3 ${alert.label || (isBuy ? "mua v\xE0o" : "b\xE1n ra")}`;
              await sendPushToUser(userId, env, {
                title,
                body,
                tag: `stock-alert-${stock.symbol}-${alert.id}`,
                url: "/stocks",
                data: { type: "stock_alert", symbol: stock.symbol, alertId: alert.id }
              });
            }
          }
        }
        if (stock.buyPrice > 0 && (stock.targetProfit || stock.stopLoss)) {
          const profitPct = (currentPrice - stock.buyPrice) / stock.buyPrice * 100;
          if (stock.targetProfit && profitPct >= stock.targetProfit) {
            totalTriggered++;
            await sendPushToUser(userId, env, {
              title: `\u{1F3AF} ${stock.symbol} \u0111\xE3 \u0111\u1EA1t m\u1EE5c ti\xEAu ch\u1ED1t l\u1EDDi!`,
              body: `L\xE3i ${profitPct.toFixed(1)}% (m\u1EE5c ti\xEAu ${stock.targetProfit}%) \u2014 Gi\xE1 hi\u1EC7n t\u1EA1i: ${currentPrice} / Gi\xE1 mua: ${stock.buyPrice}`,
              tag: `stock-tp-${stock.symbol}`,
              url: "/stocks",
              data: { type: "stock_tp", symbol: stock.symbol }
            });
          }
          if (stock.stopLoss) {
            const stopLossThreshold = stock.stopLoss < 0 ? stock.stopLoss : -Math.abs(stock.stopLoss);
            if (profitPct <= stopLossThreshold) {
              totalTriggered++;
              await sendPushToUser(userId, env, {
                title: `\u{1F6A8} ${stock.symbol} \u0111\xE3 ch\u1EA1m ng\u01B0\u1EE1ng c\u1EAFt l\u1ED7!`,
                body: `L\u1ED7 ${profitPct.toFixed(1)}% (ng\u01B0\u1EE1ng ${stopLossThreshold}%) \u2014 Gi\xE1 hi\u1EC7n t\u1EA1i: ${currentPrice} / Gi\xE1 mua: ${stock.buyPrice}`,
                tag: `stock-sl-${stock.symbol}`,
                url: "/stocks",
                data: { type: "stock_sl", symbol: stock.symbol }
              });
            }
          }
        }
      }
      if (modified) {
        await putJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`, stocks);
      }
    } catch (err) {
      console.error(`[StockAlert] Error checking user ${userId}:`, err);
    }
  }
  return `Checked ${userIds.length} users, triggered ${totalTriggered} alerts`;
}
__name(checkAllStockAlerts, "checkAllStockAlerts");

// src/controllers/stock.controller.ts
function generateId3() {
  return crypto.randomUUID();
}
__name(generateId3, "generateId");
async function handleListStocks(userId, env) {
  const stocks = await getJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`) || [];
  return jsonResponse({ success: true, data: stocks });
}
__name(handleListStocks, "handleListStocks");
async function handleCreateStock(userId, request, env) {
  const body = await request.json();
  if (!body.symbol || !body.buyPrice || !body.quantity) {
    return errorResponse("Missing required fields", 400);
  }
  const stocks = await getJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`) || [];
  const newStock = {
    id: generateId3(),
    symbol: body.symbol.toUpperCase(),
    buyPrice: body.buyPrice,
    quantity: body.quantity,
    targetProfit: body.targetProfit,
    stopLoss: body.stopLoss,
    alerts: [],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  stocks.push(newStock);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`, stocks);
  if (newStock.targetProfit || newStock.stopLoss) {
    await registerAlertUser(userId, env);
  }
  return jsonResponse({ success: true, data: newStock }, 201);
}
__name(handleCreateStock, "handleCreateStock");
async function handleUpdateStock(userId, stockId, request, env) {
  const body = await request.json();
  const stocks = await getJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`) || [];
  const index = stocks.findIndex((s) => s.id === stockId);
  if (index === -1) {
    return errorResponse("Stock not found", 404);
  }
  const updatedStock = {
    ...stocks[index],
    ...body,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  stocks[index] = updatedStock;
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`, stocks);
  if (updatedStock.targetProfit || updatedStock.stopLoss) {
    await registerAlertUser(userId, env);
  }
  return jsonResponse({ success: true, data: updatedStock });
}
__name(handleUpdateStock, "handleUpdateStock");
async function handleDeleteStock(userId, stockId, env) {
  const stocks = await getJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`) || [];
  const newStocks = stocks.filter((s) => s.id !== stockId);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`, newStocks);
  await unregisterAlertUserIfEmpty(userId, env);
  return jsonResponse({ success: true });
}
__name(handleDeleteStock, "handleDeleteStock");
async function handleAddStockAlert(userId, stockId, request, env) {
  const body = await request.json();
  if (!body.targetPrice || !body.direction) {
    return errorResponse("Missing targetPrice or direction", 400);
  }
  const stocks = await getJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`) || [];
  const stock = stocks.find((s) => s.id === stockId);
  if (!stock)
    return errorResponse("Stock not found", 404);
  if (!stock.alerts)
    stock.alerts = [];
  if (stock.alerts.length >= 10) {
    return errorResponse("Maximum 10 alerts per stock", 400);
  }
  const newAlert = {
    id: generateId3(),
    symbol: stock.symbol,
    targetPrice: body.targetPrice,
    direction: body.direction,
    label: body.label || (body.direction === "below" ? "M\u1ED1c mua" : "M\u1ED1c b\xE1n"),
    triggered: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  stock.alerts.push(newAlert);
  stock.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`, stocks);
  await registerAlertUser(userId, env);
  return jsonResponse({ success: true, data: newAlert }, 201);
}
__name(handleAddStockAlert, "handleAddStockAlert");
async function handleDeleteStockAlert(userId, stockId, alertId, env) {
  const stocks = await getJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`) || [];
  const stock = stocks.find((s) => s.id === stockId);
  if (!stock)
    return errorResponse("Stock not found", 404);
  if (!stock.alerts)
    return errorResponse("Alert not found", 404);
  stock.alerts = stock.alerts.filter((a) => a.id !== alertId);
  stock.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`, stocks);
  await unregisterAlertUserIfEmpty(userId, env);
  return jsonResponse({ success: true });
}
__name(handleDeleteStockAlert, "handleDeleteStockAlert");
async function handleResetStockAlert(userId, stockId, alertId, env) {
  const stocks = await getJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`) || [];
  const stock = stocks.find((s) => s.id === stockId);
  if (!stock)
    return errorResponse("Stock not found", 404);
  const alert = stock.alerts?.find((a) => a.id === alertId);
  if (!alert)
    return errorResponse("Alert not found", 404);
  alert.triggered = false;
  alert.notifiedAt = void 0;
  stock.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/stocks`, stocks);
  await registerAlertUser(userId, env);
  return jsonResponse({ success: true, data: alert });
}
__name(handleResetStockAlert, "handleResetStockAlert");

// src/controllers/fund.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function handleListFunds(userId, env) {
  const funds = await getJSON(env.SMART_NOTE_KV, `users/${userId}/funds`) || [];
  return jsonResponse({ success: true, data: funds });
}
__name(handleListFunds, "handleListFunds");
async function handleCreateFund(userId, request, env) {
  const body = await request.json();
  if (!body.symbol || typeof body.symbol !== "string") {
    return errorResponse("Symbol is required", 400);
  }
  if (typeof body.buyPrice !== "number" || body.buyPrice <= 0) {
    return errorResponse("Buy price must be a positive number", 400);
  }
  if (typeof body.quantity !== "number" || body.quantity <= 0) {
    return errorResponse("Quantity must be a positive number", 400);
  }
  const funds = await getJSON(env.SMART_NOTE_KV, `users/${userId}/funds`) || [];
  const fund = {
    id: generateId(),
    symbol: body.symbol.toUpperCase().trim(),
    productId: typeof body.productId === "number" ? body.productId : void 0,
    buyPrice: body.buyPrice,
    quantity: body.quantity,
    fundName: typeof body.fundName === "string" ? body.fundName.substring(0, 200) : void 0,
    fundType: typeof body.fundType === "string" ? body.fundType : void 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  funds.push(fund);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/funds`, funds);
  return jsonResponse({ success: true, data: fund }, 201);
}
__name(handleCreateFund, "handleCreateFund");
async function handleUpdateFund(userId, fundId, request, env) {
  const funds = await getJSON(env.SMART_NOTE_KV, `users/${userId}/funds`) || [];
  const idx = funds.findIndex((f) => f.id === fundId);
  if (idx === -1)
    return errorResponse("Fund not found", 404);
  const body = await request.json();
  if (body.symbol !== void 0)
    funds[idx].symbol = body.symbol.toUpperCase().trim();
  if (typeof body.buyPrice === "number")
    funds[idx].buyPrice = body.buyPrice;
  if (typeof body.quantity === "number")
    funds[idx].quantity = body.quantity;
  if (body.fundName !== void 0)
    funds[idx].fundName = body.fundName;
  if (body.fundType !== void 0)
    funds[idx].fundType = body.fundType;
  if (typeof body.productId === "number")
    funds[idx].productId = body.productId;
  funds[idx].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/funds`, funds);
  return jsonResponse({ success: true, data: funds[idx] });
}
__name(handleUpdateFund, "handleUpdateFund");
async function handleDeleteFund(userId, fundId, env) {
  const funds = await getJSON(env.SMART_NOTE_KV, `users/${userId}/funds`) || [];
  const filtered = funds.filter((f) => f.id !== fundId);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/funds`, filtered);
  return jsonResponse({ success: true });
}
__name(handleDeleteFund, "handleDeleteFund");

// src/controllers/reminder.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// src/services/reminder.service.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var REMINDER_USERS_KEY = "public/reminder-users";
var REPEAT_MS = {
  daily: 24 * 60 * 6e4,
  weekly: 7 * 24 * 60 * 6e4,
  monthly: 30 * 24 * 60 * 6e4
};
async function registerReminderUser(userId, env) {
  const users = await getJSON(env.SMART_NOTE_KV, REMINDER_USERS_KEY) || [];
  if (!users.includes(userId)) {
    users.push(userId);
    await putJSON(env.SMART_NOTE_KV, REMINDER_USERS_KEY, users);
  }
}
__name(registerReminderUser, "registerReminderUser");
async function unregisterReminderUserIfEmpty(userId, env) {
  const reminders = await getJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`) || [];
  const hasActive = reminders.some((r) => r.status === "active");
  if (!hasActive) {
    const users = await getJSON(env.SMART_NOTE_KV, REMINDER_USERS_KEY) || [];
    const filtered = users.filter((u) => u !== userId);
    await putJSON(env.SMART_NOTE_KV, REMINDER_USERS_KEY, filtered);
  }
}
__name(unregisterReminderUserIfEmpty, "unregisterReminderUserIfEmpty");
function formatCountdown(eventDate) {
  const diff = new Date(eventDate).getTime() - Date.now();
  if (diff <= 0)
    return "\u0110\xE3 \u0111\u1EBFn h\u1EA1n!";
  const minutes = Math.floor(diff / 6e4);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0)
    return `C\xF2n ${days} ng\xE0y`;
  if (hours > 0)
    return `C\xF2n ${hours} gi\u1EDD`;
  return `C\xF2n ${minutes} ph\xFAt`;
}
__name(formatCountdown, "formatCountdown");
function advanceRecurring(reminder) {
  const interval = reminder.repeatInterval;
  if (!interval || interval === "none")
    return;
  const eventMs = new Date(reminder.eventDate).getTime();
  let nextMs = eventMs;
  if (REPEAT_MS[interval]) {
    nextMs = eventMs + REPEAT_MS[interval];
  } else {
    const customMinutes = parseInt(interval, 10);
    if (!isNaN(customMinutes) && customMinutes > 0) {
      nextMs = eventMs + customMinutes * 6e4;
    } else {
      return;
    }
  }
  reminder.eventDate = new Date(nextMs).toISOString();
  reminder.notifiedAt = [];
  reminder.acknowledged = false;
  reminder.lastChanceSent = false;
  const OFFSET_MS2 = {
    "15m": 15 * 6e4,
    "30m": 30 * 6e4,
    "1h": 60 * 6e4,
    "2h": 2 * 60 * 6e4,
    "3h": 3 * 60 * 6e4,
    "1d": 24 * 60 * 6e4,
    "2d": 2 * 24 * 60 * 6e4,
    "3d": 3 * 24 * 60 * 6e4,
    "1w": 7 * 24 * 60 * 6e4
  };
  const results = [];
  for (const offset of reminder.offsets) {
    const ms = OFFSET_MS2[offset];
    if (ms) {
      const fireTime = nextMs - ms;
      if (fireTime > Date.now())
        results.push(new Date(fireTime).toISOString());
    }
  }
  if (reminder.customRemindAt) {
    const customMs = new Date(reminder.customRemindAt).getTime();
    const shift = nextMs - new Date(reminder.eventDate).getTime();
    const newCustomMs = customMs + (nextMs - eventMs);
    if (newCustomMs > Date.now()) {
      reminder.customRemindAt = new Date(newCustomMs).toISOString();
      results.push(reminder.customRemindAt);
    }
  }
  reminder.remindAt = [...new Set(results)].sort();
  reminder.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
}
__name(advanceRecurring, "advanceRecurring");
async function checkAllReminders(env) {
  const userIds = await getJSON(env.SMART_NOTE_KV, REMINDER_USERS_KEY) || [];
  if (userIds.length === 0)
    return "No users with reminders";
  const now = Date.now();
  const ONE_HOUR = 60 * 6e4;
  let totalNotified = 0;
  let totalExpired = 0;
  for (const userId of userIds) {
    try {
      const reminders = await getJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`) || [];
      let modified = false;
      for (const reminder of reminders) {
        if (reminder.status !== "active")
          continue;
        const eventMs = new Date(reminder.eventDate).getTime();
        for (const fireTime of reminder.remindAt) {
          const fireMs = new Date(fireTime).getTime();
          if (fireMs <= now && !reminder.notifiedAt.includes(fireTime)) {
            reminder.notifiedAt.push(fireTime);
            modified = true;
            totalNotified++;
            const countdown = formatCountdown(reminder.eventDate);
            await sendPushToUser(userId, env, {
              title: `\u{1F514} ${reminder.title}`,
              body: `${countdown} \u2014 ${reminder.description || "\u0110\u1EBFn gi\u1EDD nh\u1EAFc nh\u1EDF!"}`,
              tag: `reminder-${reminder.id}-${fireTime}`,
              url: "/reminders",
              data: { type: "reminder", reminderId: reminder.id }
            });
          }
        }
        if (!reminder.acknowledged && !reminder.lastChanceSent) {
          const timeUntilEvent = eventMs - now;
          if (timeUntilEvent > 0 && timeUntilEvent <= ONE_HOUR) {
            reminder.lastChanceSent = true;
            modified = true;
            totalNotified++;
            await sendPushToUser(userId, env, {
              title: `\u{1F6A8} L\u1EA6N CU\u1ED0I: ${reminder.title}`,
              body: `\u23F0 C\xF2n ch\u01B0a \u0111\u1EA7y 1 gi\u1EDD! ${reminder.description || "H\xE3y ki\u1EC3m tra ngay!"}`,
              tag: `reminder-lastchance-${reminder.id}`,
              url: "/reminders",
              data: { type: "reminder_lastchance", reminderId: reminder.id }
            });
          }
        }
        if (eventMs < now) {
          if (reminder.repeatInterval && reminder.repeatInterval !== "none") {
            advanceRecurring(reminder);
            modified = true;
          } else {
            reminder.status = "expired";
            reminder.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
            modified = true;
            totalExpired++;
          }
        }
      }
      if (modified) {
        await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, reminders);
      }
      const hasActive = reminders.some((r) => r.status === "active");
      if (!hasActive) {
        const users = await getJSON(env.SMART_NOTE_KV, REMINDER_USERS_KEY) || [];
        await putJSON(env.SMART_NOTE_KV, REMINDER_USERS_KEY, users.filter((u) => u !== userId));
      }
    } catch (err) {
      console.error(`[Reminder] Error checking user ${userId}:`, err);
    }
  }
  return `Checked ${userIds.length} users, sent ${totalNotified} notifications, expired ${totalExpired} reminders`;
}
__name(checkAllReminders, "checkAllReminders");

// src/controllers/reminder.controller.ts
var OFFSET_MS = {
  "15m": 15 * 6e4,
  "30m": 30 * 6e4,
  "1h": 60 * 6e4,
  "2h": 2 * 60 * 6e4,
  "3h": 3 * 60 * 6e4,
  "1d": 24 * 60 * 6e4,
  "2d": 2 * 24 * 60 * 6e4,
  "3d": 3 * 24 * 60 * 6e4,
  "1w": 7 * 24 * 60 * 6e4
};
function calculateRemindAt(eventDate, offsets, customRemindAt) {
  const eventMs = new Date(eventDate).getTime();
  if (isNaN(eventMs))
    return [];
  const results = [];
  for (const offset of offsets) {
    const ms = OFFSET_MS[offset];
    if (!ms)
      continue;
    const fireTime = eventMs - ms;
    if (fireTime > Date.now()) {
      results.push(new Date(fireTime).toISOString());
    }
  }
  if (customRemindAt) {
    const customMs = new Date(customRemindAt).getTime();
    if (!isNaN(customMs) && customMs > Date.now()) {
      results.push(new Date(customMs).toISOString());
    }
  }
  return [...new Set(results)].sort();
}
__name(calculateRemindAt, "calculateRemindAt");
async function handleListReminders(userId, env) {
  const reminders = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/reminders`
  ) || [];
  const now = Date.now();
  let modified = false;
  for (const r of reminders) {
    if (r.status === "active" && new Date(r.eventDate).getTime() < now && (!r.repeatInterval || r.repeatInterval === "none")) {
      r.status = "expired";
      r.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      modified = true;
    }
  }
  if (modified) {
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, reminders);
  }
  reminders.sort((a, b) => {
    if (a.status === "active" && b.status !== "active")
      return -1;
    if (a.status !== "active" && b.status === "active")
      return 1;
    return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
  });
  return jsonResponse({ success: true, data: reminders });
}
__name(handleListReminders, "handleListReminders");
async function handleCreateReminder(userId, request, env) {
  const body = await request.json();
  const { title, description, eventDate, offsets, customRemindAt, repeatInterval, sourceType, sourceId, url } = body;
  if (!title || !eventDate) {
    return errorResponse("Title and eventDate are required");
  }
  const validOffsets = (offsets || ["1h", "1d"]).filter((o) => OFFSET_MS[o]);
  const remindAt = calculateRemindAt(eventDate, validOffsets, customRemindAt);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const reminder = {
    id: generateId(),
    title: title.trim(),
    description: (description || "").trim(),
    url: url ? url.trim() : void 0,
    eventDate,
    remindAt,
    offsets: validOffsets,
    customRemindAt: customRemindAt || void 0,
    repeatInterval: repeatInterval || "none",
    notifiedAt: [],
    acknowledged: false,
    lastChanceSent: false,
    sourceType: sourceType || "manual",
    sourceId: sourceId || void 0,
    status: "active",
    createdAt: now,
    updatedAt: now
  };
  const reminders = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/reminders`
  ) || [];
  reminders.push(reminder);
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 6e4;
  const cleaned = reminders.filter(
    (r) => r.status === "active" || new Date(r.updatedAt).getTime() > thirtyDaysAgo
  );
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, cleaned);
  await registerReminderUser(userId, env);
  return jsonResponse({ success: true, data: reminder }, 201);
}
__name(handleCreateReminder, "handleCreateReminder");
async function handleUpdateReminder(userId, reminderId, request, env) {
  const reminders = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/reminders`
  ) || [];
  const idx = reminders.findIndex((r) => r.id === reminderId);
  if (idx === -1)
    return errorResponse("Reminder not found", 404);
  const body = await request.json();
  const existing = reminders[idx];
  if (body.title !== void 0)
    existing.title = body.title.trim();
  if (body.description !== void 0)
    existing.description = body.description.trim();
  if (body.url !== void 0)
    existing.url = body.url ? body.url.trim() : void 0;
  if (body.eventDate !== void 0)
    existing.eventDate = body.eventDate;
  if (body.offsets !== void 0)
    existing.offsets = body.offsets.filter((o) => OFFSET_MS[o]);
  if (body.customRemindAt !== void 0)
    existing.customRemindAt = body.customRemindAt || void 0;
  if (body.repeatInterval !== void 0)
    existing.repeatInterval = body.repeatInterval;
  if (body.acknowledged !== void 0)
    existing.acknowledged = body.acknowledged;
  if (body.eventDate !== void 0 || body.offsets !== void 0 || body.customRemindAt !== void 0) {
    existing.remindAt = calculateRemindAt(existing.eventDate, existing.offsets, existing.customRemindAt);
    existing.notifiedAt = [];
    existing.lastChanceSent = false;
  }
  if (body.status !== void 0)
    existing.status = body.status;
  existing.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  reminders[idx] = existing;
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, reminders);
  return jsonResponse({ success: true, data: existing });
}
__name(handleUpdateReminder, "handleUpdateReminder");
async function handleDeleteReminder(userId, reminderId, env) {
  const reminders = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/reminders`
  ) || [];
  const filtered = reminders.filter((r) => r.id !== reminderId);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, filtered);
  await unregisterReminderUserIfEmpty(userId, env);
  return jsonResponse({ success: true });
}
__name(handleDeleteReminder, "handleDeleteReminder");
async function handleClearReminders(userId, request, env) {
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") || "all";
  let reminders = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/reminders`
  ) || [];
  if (statusFilter === "all") {
    reminders = [];
  } else if (statusFilter === "completed") {
    reminders = reminders.filter((r) => r.status !== "completed" && r.status !== "expired");
  } else if (statusFilter === "active") {
    reminders = reminders.filter((r) => r.status !== "active");
  }
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, reminders);
  if (reminders.length === 0) {
    await unregisterReminderUserIfEmpty(userId, env);
  }
  return jsonResponse({ success: true });
}
__name(handleClearReminders, "handleClearReminders");
async function handleCompleteReminder(userId, reminderId, env) {
  const reminders = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/reminders`
  ) || [];
  const idx = reminders.findIndex((r) => r.id === reminderId);
  if (idx === -1)
    return errorResponse("Reminder not found", 404);
  reminders[idx].status = "completed";
  reminders[idx].acknowledged = true;
  reminders[idx].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, reminders);
  await unregisterReminderUserIfEmpty(userId, env);
  return jsonResponse({ success: true });
}
__name(handleCompleteReminder, "handleCompleteReminder");
async function handleAcknowledgeReminder(userId, reminderId, env) {
  const reminders = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/reminders`
  ) || [];
  const idx = reminders.findIndex((r) => r.id === reminderId);
  if (idx === -1)
    return errorResponse("Reminder not found", 404);
  reminders[idx].acknowledged = true;
  reminders[idx].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/reminders`, reminders);
  return jsonResponse({ success: true });
}
__name(handleAcknowledgeReminder, "handleAcknowledgeReminder");
function stripMarkdown(text) {
  return text.replace(/\[([^\]]*)\]\(([^)]+)\)/g, "$1 $2").replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1").replace(/_{1,3}([^_]+)_{1,3}/g, "$1").replace(/^#{1,6}\s+/gm, "").replace(/^\s*[-*+]\s+/gm, "\u2022 ").replace(/`([^`]+)`/g, "$1").replace(/\n{3,}/g, "\n\n").trim();
}
__name(stripMarkdown, "stripMarkdown");
async function handleAiDetectReminders(userId, request, env) {
  if (!env.AI)
    return errorResponse("AI binding not configured", 503);
  const body = await request.json();
  const { content } = body;
  if (!content)
    return errorResponse("Content is required");
  const cleanContent = stripMarkdown(content);
  const now = /* @__PURE__ */ new Date();
  const currentYear = now.getFullYear();
  const currentDateISO = now.toISOString();
  const systemPrompt = `B\u1EA1n l\xE0 AI chuy\xEAn tr\xEDch xu\u1EA5t s\u1EF1 ki\u1EC7n, task, deadline t\u1EEB v\u0103n b\u1EA3n.
Ph\xE2n t\xEDch n\u1ED9i dung v\xE0 tr\u1EA3 v\u1EC1 danh s\xE1ch c\xE1c s\u1EF1 ki\u1EC7n d\u01B0\u1EDBi d\u1EA1ng JSON ARRAY.

QUY T\u1EAEC B\u1EAET BU\u1ED8C:
1. CH\u1EC8 tr\u1EA3 v\u1EC1 JSON ARRAY h\u1EE3p l\u1EC7 (t\u1ED1i \u0111a 5 item). KH\xD4NG gi\u1EA3i th\xEDch, KH\xD4NG th\xEAm text b\xEAn ngo\xE0i.
2. C\u1EA5u tr\xFAc m\u1ED7i item: {"title": "string", "eventDate": "ISO 8601", "description": "string", "url": "string ho\u1EB7c null"}
3. C\xC1CH PARSE NG\xC0Y:
   - "13/5" \u2192 "${currentYear}-05-13T09:00:00.000Z"
   - "19/5" \u2192 "${currentYear}-05-19T09:00:00.000Z"  
   - "Build 1: 13/5" \u2192 eventDate = "${currentYear}-05-13T09:00:00.000Z"
   - N\u1EBFu c\xF3 gi\u1EDD c\u1EE5 th\u1EC3 (VD: "3h chi\u1EC1u") \u2192 d\xF9ng gi\u1EDD \u0111\xF3
   - N\u1EBFu KH\xD4NG c\xF3 gi\u1EDD \u2192 m\u1EB7c \u0111\u1ECBnh 09:00:00
4. "description": Gi\u1EEF nguy\xEAn m\xF4 t\u1EA3 task/chi ti\u1EBFt t\u1EEB v\u0103n b\u1EA3n g\u1ED1c.
5. "url": Tr\xEDch xu\u1EA5t m\u1ECDi \u0111\u01B0\u1EDDng link https://... n\u1EBFu c\xF3. N\u1EBFu kh\xF4ng c\xF3 url \u2192 null
6. N\u1EBFu KH\xD4NG t\xECm th\u1EA5y s\u1EF1 ki\u1EC7n n\xE0o \u2192 tr\u1EA3 v\u1EC1 []

Th\u1EDDi gian hi\u1EC7n t\u1EA1i: ${currentDateISO}

V\xCD D\u1EE4:
Input: "Build 1: 13/5 - Task: Chuy\u1EC3n API monitor cho SCC - Link: https://jira.example.com/123"
Output: [{"title":"Build 1","eventDate":"${currentYear}-05-13T09:00:00.000Z","description":"Task: Chuy\u1EC3n API monitor cho SCC","url":"https://jira.example.com/123"}]

Input: "H\u1ECDp team l\xFAc 2h chi\u1EC1u ng\xE0y 20/5"
Output: [{"title":"H\u1ECDp team","eventDate":"${currentYear}-05-20T07:00:00.000Z","description":"H\u1ECDp team l\xFAc 2h chi\u1EC1u ng\xE0y 20/5","url":null}]`;
  try {
    const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: cleanContent.substring(0, 3e3) }
      ],
      max_tokens: 1024,
      temperature: 0.1
    });
    const rawResponse = response?.response ?? response?.result ?? "";
    const text = String(typeof rawResponse === "object" ? JSON.stringify(rawResponse) : rawResponse).trim();
    let events = [];
    try {
      const parsed = JSON.parse(text);
      events = Array.isArray(parsed) ? parsed : [];
    } catch {
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch)
          events = JSON.parse(jsonMatch[0]);
      } catch {
        events = [];
      }
    }
    const validEvents = events.filter((e) => e?.title && e?.eventDate).map((e) => {
      let eventDate = String(e.eventDate);
      if (isNaN(new Date(eventDate).getTime())) {
        const dateMatch = eventDate.match(/(\d{1,2})\/(\d{1,2})/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, "0");
          const month = dateMatch[2].padStart(2, "0");
          eventDate = `${currentYear}-${month}-${day}T09:00:00.000Z`;
        }
      }
      return {
        title: String(e.title).substring(0, 100),
        eventDate,
        description: String(e.description || "").substring(0, 300),
        url: e.url && e.url !== "null" ? String(e.url).substring(0, 500) : void 0
      };
    }).filter((e) => !isNaN(new Date(e.eventDate).getTime())).slice(0, 5);
    return jsonResponse({ success: true, data: validEvents });
  } catch (err) {
    return errorResponse(err.message || "AI detection failed", 500);
  }
}
__name(handleAiDetectReminders, "handleAiDetectReminders");

// src/controllers/todo.controller.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var MAX_TODOS = 100;
var DONE_CLEANUP_DAYS = 7;
function cleanupTodos(todos) {
  const cutoff = Date.now() - DONE_CLEANUP_DAYS * 24 * 60 * 6e4;
  const cleaned = todos.filter(
    (t) => t.status !== "done" || new Date(t.updatedAt).getTime() > cutoff
  );
  if (cleaned.length > MAX_TODOS) {
    cleaned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return cleaned.slice(0, MAX_TODOS);
  }
  return cleaned;
}
__name(cleanupTodos, "cleanupTodos");
async function handleListTodos(userId, env) {
  const todos = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/todos`
  ) || [];
  todos.sort((a, b) => {
    if (a.status !== "done" && b.status === "done")
      return -1;
    if (a.status === "done" && b.status !== "done")
      return 1;
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });
  return jsonResponse({ success: true, data: todos });
}
__name(handleListTodos, "handleListTodos");
async function handleCreateTodo(userId, request, env) {
  const body = await request.json();
  const { title, description, time, priority, category } = body;
  if (!title || !time) {
    return errorResponse("Title and time are required");
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const todo = {
    id: generateId(),
    title: title.trim(),
    description: (description || "").trim(),
    time,
    priority: priority || "medium",
    status: "pending",
    category: category || void 0,
    createdAt: now,
    updatedAt: now
  };
  let todos = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/todos`
  ) || [];
  todos.push(todo);
  todos = cleanupTodos(todos);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/todos`, todos);
  return jsonResponse({ success: true, data: todo }, 201);
}
__name(handleCreateTodo, "handleCreateTodo");
async function handleUpdateTodo(userId, todoId, request, env) {
  const todos = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/todos`
  ) || [];
  const idx = todos.findIndex((t) => t.id === todoId);
  if (idx === -1)
    return errorResponse("Todo not found", 404);
  const body = await request.json();
  const existing = todos[idx];
  if (body.title !== void 0)
    existing.title = body.title.trim();
  if (body.description !== void 0)
    existing.description = (body.description || "").trim();
  if (body.time !== void 0)
    existing.time = body.time;
  if (body.priority !== void 0)
    existing.priority = body.priority;
  if (body.status !== void 0)
    existing.status = body.status;
  if (body.category !== void 0)
    existing.category = body.category || void 0;
  if (body.reminderId !== void 0)
    existing.reminderId = body.reminderId || void 0;
  existing.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  todos[idx] = existing;
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/todos`, todos);
  return jsonResponse({ success: true, data: existing });
}
__name(handleUpdateTodo, "handleUpdateTodo");
async function handleDeleteTodo(userId, todoId, env) {
  const todos = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/todos`
  ) || [];
  const filtered = todos.filter((t) => t.id !== todoId);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/todos`, filtered);
  return jsonResponse({ success: true });
}
__name(handleDeleteTodo, "handleDeleteTodo");
async function handleClearTodos(userId, request, env) {
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") || "all";
  let todos = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/todos`
  ) || [];
  if (statusFilter === "all") {
    todos = [];
  } else if (statusFilter === "done") {
    todos = todos.filter((t) => t.status !== "done");
  } else if (statusFilter === "pending") {
    todos = todos.filter((t) => t.status !== "pending");
  }
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/todos`, todos);
  return jsonResponse({ success: true });
}
__name(handleClearTodos, "handleClearTodos");
async function handleAiGenerateTodos(userId, request, env) {
  if (!env.AI)
    return errorResponse("AI binding not configured", 503);
  const body = await request.json();
  const { content } = body;
  if (!content)
    return errorResponse("Content is required");
  const now = /* @__PURE__ */ new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentDay = String(now.getDate()).padStart(2, "0");
  const currentDateISO = now.toISOString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  const systemPrompt = `B\u1EA1n l\xE0 AI chuy\xEAn ph\xE2n t\xEDch l\u1ECBch tr\xECnh v\xE0 t\u1EA1o to-do list t\u1EEB v\u0103n b\u1EA3n ti\u1EBFng Vi\u1EC7t.
Ph\xE2n t\xEDch n\u1ED9i dung v\xE0 tr\u1EA3 v\u1EC1 danh s\xE1ch c\xF4ng vi\u1EC7c d\u01B0\u1EDBi d\u1EA1ng JSON ARRAY.

QUY T\u1EAEC B\u1EAET BU\u1ED8C:
1. CH\u1EC8 tr\u1EA3 v\u1EC1 JSON ARRAY h\u1EE3p l\u1EC7 (t\u1ED1i \u0111a 10 item). KH\xD4NG gi\u1EA3i th\xEDch, KH\xD4NG th\xEAm text b\xEAn ngo\xE0i.
2. C\u1EA5u tr\xFAc m\u1ED7i item: {"title": "string", "description": "string", "time": "ISO 8601", "priority": "low|medium|high|urgent", "category": "work|personal|health|finance|study|other"}
3. C\xC1CH PARSE TH\u1EDCI GIAN:
   - "9h s\xE1ng" ho\u1EB7c "9h" \u2192 ${currentYear}-${currentMonth}-${currentDay}T09:00:00.000Z
   - "2h chi\u1EC1u" ho\u1EB7c "14h" \u2192 ${currentYear}-${currentMonth}-${currentDay}T14:00:00.000Z
   - "5h chi\u1EC1u" \u2192 ${currentYear}-${currentMonth}-${currentDay}T17:00:00.000Z
   - "8h t\u1ED1i" \u2192 ${currentYear}-${currentMonth}-${currentDay}T20:00:00.000Z
   - "mai" ho\u1EB7c "ng\xE0y mai" \u2192 d\xF9ng ng\xE0y ${tomorrowStr}
   - "13/5" \u2192 ${currentYear}-05-13
   - N\u1EBFu KH\xD4NG n\xF3i r\xF5 ng\xE0y \u2192 m\u1EB7c \u0111\u1ECBnh h\xF4m nay ${currentYear}-${currentMonth}-${currentDay}
   - N\u1EBFu KH\xD4NG n\xF3i r\xF5 gi\u1EDD \u2192 m\u1EB7c \u0111\u1ECBnh 09:00:00
4. priority: D\u1EF1a tr\xEAn t\u1EEB kh\xF3a:
   - "g\u1EA5p", "urgent", "kh\u1EA9n c\u1EA5p", "ngay" \u2192 "urgent"
   - "quan tr\u1ECDng", "important", "c\u1EA7n thi\u1EBFt" \u2192 "high"
   - "b\xECnh th\u01B0\u1EDDng", m\u1EB7c \u0111\u1ECBnh \u2192 "medium"
   - "khi r\u1EA3nh", "t\xF9y", "kh\xF4ng g\u1EA5p" \u2192 "low"
5. category: \u0110o\xE1n t\u1EEB context:
   - "h\u1ECDp", "meeting", "review", "deploy", "code", "jira", "sprint" \u2192 "work"
   - "gym", "t\u1EADp", "ch\u1EA1y b\u1ED9", "yoga", "b\xE1c s\u0129", "kh\xE1m" \u2192 "health"
   - "\u0103n", "n\u1EA5u", "gi\u1EB7t", "d\u1ECDn", "mua s\u1EAFm" \u2192 "personal"
   - "ti\u1EC1n", "chuy\u1EC3n kho\u1EA3n", "tr\u1EA3 n\u1EE3", "\u0111\u1EA7u t\u01B0" \u2192 "finance"
   - "h\u1ECDc", "\u0111\u1ECDc s\xE1ch", "course", "b\xE0i t\u1EADp" \u2192 "study"
   - Kh\xF4ng r\xF5 \u2192 "other"
6. N\u1EBFu KH\xD4NG t\xECm th\u1EA5y task n\xE0o \u2192 tr\u1EA3 v\u1EC1 []

Th\u1EDDi gian hi\u1EC7n t\u1EA1i: ${currentDateISO}

V\xCD D\u1EE4:
Input: "9h s\xE1ng h\u1ECDp standup, 2h chi\u1EC1u code feature login, 5h gym"
Output: [{"title":"H\u1ECDp standup","description":"H\u1ECDp team bu\u1ED5i s\xE1ng","time":"${currentYear}-${currentMonth}-${currentDay}T09:00:00.000Z","priority":"medium","category":"work"},{"title":"Code feature login","description":"Ph\xE1t tri\u1EC3n t\xEDnh n\u0103ng \u0111\u0103ng nh\u1EADp","time":"${currentYear}-${currentMonth}-${currentDay}T14:00:00.000Z","priority":"medium","category":"work"},{"title":"T\u1EADp gym","description":"T\u1EADp luy\u1EC7n th\u1EC3 d\u1EE5c","time":"${currentYear}-${currentMonth}-${currentDay}T17:00:00.000Z","priority":"medium","category":"health"}]`;
  try {
    const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: content.substring(0, 3e3) }
      ],
      max_tokens: 2048,
      temperature: 0.1
    });
    const rawResponse = response?.response ?? response?.result ?? "";
    const text = String(typeof rawResponse === "object" ? JSON.stringify(rawResponse) : rawResponse).trim();
    let tasks = [];
    try {
      const parsed = JSON.parse(text);
      tasks = Array.isArray(parsed) ? parsed : [];
    } catch {
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch)
          tasks = JSON.parse(jsonMatch[0]);
      } catch {
        tasks = [];
      }
    }
    const validTasks = tasks.filter((t) => t?.title && t?.time).map((t) => {
      let time = String(t.time);
      if (isNaN(new Date(time).getTime())) {
        time = `${currentYear}-${currentMonth}-${currentDay}T09:00:00.000Z`;
      }
      const validPriorities = ["low", "medium", "high", "urgent"];
      const validCategories = ["work", "personal", "health", "finance", "study", "other"];
      return {
        title: String(t.title).substring(0, 100),
        description: String(t.description || "").substring(0, 300),
        time,
        priority: validPriorities.includes(t.priority) ? t.priority : "medium",
        category: validCategories.includes(t.category) ? t.category : "other"
      };
    }).filter((t) => !isNaN(new Date(t.time).getTime())).slice(0, 10);
    return jsonResponse({ success: true, data: validTasks });
  } catch (err) {
    return errorResponse(err.message || "AI todo generation failed", 500);
  }
}
__name(handleAiGenerateTodos, "handleAiGenerateTodos");

// src/services/trading-reminder.service.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var TRADING_REMINDER_USERS_KEY2 = "public/trading-reminder-users";
var TRADING_CONFIG_KEY2 = /* @__PURE__ */ __name((userId) => `users/${userId}/trading/config`, "TRADING_CONFIG_KEY");
var TRADING_CHECKINS_KEY2 = /* @__PURE__ */ __name((userId) => `users/${userId}/trading/checkins`, "TRADING_CHECKINS_KEY");
function toVnTime(date) {
  const VN_OFFSET_MS = 7 * 60 * 60 * 1e3;
  const vnMs = date.getTime() + VN_OFFSET_MS;
  const vnDate = new Date(vnMs);
  const hour = vnDate.getUTCHours();
  const minute = vnDate.getUTCMinutes();
  const dateStr = vnDate.toISOString().substring(0, 10);
  return { hour, minute, dateStr };
}
__name(toVnTime, "toVnTime");
async function checkTradingReminders(env) {
  const userIds = await getJSON(env.SMART_NOTE_KV, TRADING_REMINDER_USERS_KEY2) || [];
  if (userIds.length === 0)
    return "[TradingReminder] No users registered";
  const now = /* @__PURE__ */ new Date();
  const { hour: vnHour, minute: vnMinute, dateStr: vnToday } = toVnTime(now);
  const nowMinutes = vnHour * 60 + vnMinute;
  let sent = 0;
  let skipped = 0;
  for (const userId of userIds) {
    try {
      const config = await getJSON(env.SMART_NOTE_KV, TRADING_CONFIG_KEY2(userId));
      if (!config?.reminderTime) {
        skipped++;
        continue;
      }
      const [rHour, rMinute] = config.reminderTime.split(":").map(Number);
      if (isNaN(rHour) || isNaN(rMinute)) {
        skipped++;
        continue;
      }
      const reminderMinutes = rHour * 60 + rMinute;
      const diff = Math.abs(nowMinutes - reminderMinutes);
      const withinWindow = diff <= 15 || diff >= 24 * 60 - 15;
      if (!withinWindow) {
        skipped++;
        continue;
      }
      if (config.reminderNotifiedDate === vnToday) {
        skipped++;
        continue;
      }
      const checkins = await getJSON(env.SMART_NOTE_KV, TRADING_CHECKINS_KEY2(userId)) || [];
      const alreadyCheckedIn = checkins.some((c) => c.date === vnToday);
      if (alreadyCheckedIn) {
        skipped++;
        config.reminderNotifiedDate = vnToday;
        config.updatedAt = now.toISOString();
        await putJSON(env.SMART_NOTE_KV, TRADING_CONFIG_KEY2(userId), config);
        continue;
      }
      await sendPushToUser(userId, env, {
        title: "\u{1F4CA} Nh\u1EDB check-in trading h\xF4m nay!",
        body: "C\u1EADp nh\u1EADt l\xE3i/l\u1ED7 \u0111\u1EC3 theo d\xF5i hi\u1EC7u su\u1EA5t giao d\u1ECBch c\u1EE7a b\u1EA1n",
        tag: `trading-reminder-${vnToday}`,
        url: "/trading?checkin=1",
        data: { type: "trading_reminder", date: vnToday }
      });
      config.reminderNotifiedDate = vnToday;
      config.updatedAt = now.toISOString();
      await putJSON(env.SMART_NOTE_KV, TRADING_CONFIG_KEY2(userId), config);
      sent++;
    } catch (err) {
      console.error(`[TradingReminder] Error processing user ${userId}:`, err);
    }
  }
  return `[TradingReminder] Processed ${userIds.length} users \u2014 sent ${sent}, skipped ${skipped}`;
}
__name(checkTradingReminders, "checkTradingReminders");

// src/index.ts
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  try {
    if (path === "/api/proxy/location" && request.method === "GET") {
      return handleProxyLocation(request);
    }
    if (path === "/api/proxy/weather" && request.method === "GET") {
      return handleProxyWeather(request);
    }
    if (path === "/api/proxy/exchange-rate" && request.method === "GET") {
      return handleProxyExchangeRate(request);
    }
    if (path === "/api/proxy/stock-price" && request.method === "GET") {
      return handleProxyStockPrice(request, env);
    }
    if (path === "/api/proxy/stock-history" && request.method === "GET") {
      return handleProxyStockHistory(request, env);
    }
    if (path === "/api/proxy/logo" && request.method === "GET") {
      return handleProxyLogo(request);
    }
    if (path === "/api/proxy/fund-nav" && request.method === "GET") {
      return handleProxyFundNav(request, env);
    }
    if (path === "/api/proxy/fund-history" && request.method === "GET") {
      return handleProxyFundHistory(request, env);
    }
    if (path === "/api/proxy/fund-list" && request.method === "GET") {
      return handleProxyFundList(request, env);
    }
    if (path === "/api/auth/register" && request.method === "POST") {
      return handleRegister(request, env);
    }
    if (path === "/api/auth/login" && request.method === "POST") {
      return handleLogin(request, env);
    }
    if (path === "/api/auth/google-oauth-url" && request.method === "POST") {
      return handleGoogleOAuthUrl(request, env);
    }
    if (path === "/api/auth/google-verify" && request.method === "POST") {
      return handleGoogleVerify(request, env);
    }
    if (path === "/api/auth/reset-password" && request.method === "POST") {
      return handleResetPassword(request, env);
    }
    if (path === "/api/auth/google-signin" && request.method === "POST") {
      return handleGoogleSignIn(request, env);
    }
    if (path === "/api/auth/refresh" && request.method === "POST") {
      return handleRefreshToken(request, env);
    }
    if (path === "/api/webhook/telegram" && request.method === "POST") {
      return handleTelegramWebhook(request, env);
    }
    if (path === "/api/webhook/notification" && request.method === "POST") {
      return handleNotificationWebhook(request, env);
    }
    if (path === "/api/webhook/sms" && request.method === "POST") {
      return handleSmsWebhook(request, env);
    }
    if (path === "/api/blogs" && request.method === "GET") {
      return handleListBlogs(request, env);
    }
    const publicBlogMatch = path.match(/^\/api\/blogs\/([^\/]+)$/);
    if (publicBlogMatch && request.method === "GET") {
      return handleGetBlog(publicBlogMatch[1], env);
    }
    const blogViewMatch = path.match(/^\/api\/blogs\/([^\/]+)\/view$/);
    if (blogViewMatch && request.method === "POST") {
      return handleBlogView(blogViewMatch[1], request, env);
    }
    const imageMatch = path.match(/^\/api\/images\/([^\/]+)$/);
    if (imageMatch && request.method === "GET") {
      return handleGetImage(imageMatch[1], env);
    }
    if (path === "/api/sitemap.xml" && request.method === "GET") {
      const blogsIndex = await env.SMART_NOTE_KV.get("public/blogs/_index", "json");
      const blogs = (blogsIndex?.blogs || []).filter((b) => b.published !== false);
      const siteUrl = env.FRONTEND_URL || "https://finnote-f4n.pages.dev";
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>${siteUrl}/blog</loc>
    <priority>0.9</priority>
    <changefreq>daily</changefreq>
  </url>`;
      for (const blog of blogs) {
        const lastmod = blog.updatedAt || blog.createdAt || (/* @__PURE__ */ new Date()).toISOString();
        xml += `
  <url>
    <loc>${siteUrl}/blog/${blog.slug}</loc>
    <lastmod>${lastmod.split("T")[0]}</lastmod>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
  </url>`;
      }
      xml += "\n</urlset>";
      return new Response(xml, {
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "public, max-age=3600",
          ...corsHeaders(env, request.headers.get("Origin"))
        }
      });
    }
    const sharedNoteMatch = path.match(/^\/api\/notes\/shared\/(.+)$/);
    if (sharedNoteMatch && request.method === "GET") {
      return handleGetSharedNote(sharedNoteMatch[1], request, env);
    }
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Unauthorized", 401);
    }
    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload)
      return errorResponse("Invalid token", 401);
    const userId = payload.userId;
    if (path === "/api/auth/profile" && request.method === "PUT") {
      return handleUpdateProfile(userId, request, env);
    }
    if (path === "/api/auth/delete-account" && request.method === "POST") {
      return handleDeleteAccount(userId, request, env);
    }
    if (path === "/api/blogs" && request.method === "POST") {
      return handleCreateBlog(userId, request, env);
    }
    if (path === "/api/blogs/generate-content" && request.method === "POST") {
      return handleGenerateBlogContent(userId, request, env);
    }
    if (path === "/api/blogs/refine-content" && request.method === "POST") {
      return handleRefineBlogContent(userId, request, env);
    }
    if (path === "/api/blogs/generate-image" && request.method === "POST") {
      return handleGenerateBlogImage(userId, request, env);
    }
    if (path === "/api/images" && request.method === "POST") {
      return handleUploadImage(userId, request, env);
    }
    const adminBlogMatch = path.match(/^\/api\/blogs\/([^\/]+)$/);
    if (adminBlogMatch && request.method === "PUT") {
      return handleUpdateBlog(userId, adminBlogMatch[1], request, env);
    }
    if (adminBlogMatch && request.method === "DELETE") {
      return handleDeleteBlog(userId, adminBlogMatch[1], env);
    }
    if (path === "/api/report-bug" && request.method === "POST") {
      return handleReportBug(userId, request, env);
    }
    if (path === "/api/contact-feedback" && request.method === "POST") {
      return handleContactFeedback(userId, request, env);
    }
    if (path === "/api/notes" && request.method === "GET") {
      return handleListNotes(userId, env);
    }
    if (path === "/api/notes" && request.method === "POST") {
      return handleCreateNote(userId, request, env);
    }
    const noteMatch = path.match(/^\/api\/notes\/(.+)$/);
    if (noteMatch) {
      const noteId = noteMatch[1];
      if (request.method === "GET")
        return handleGetNote(userId, noteId, env);
      if (request.method === "PUT")
        return handleUpdateNote(userId, noteId, request, env);
      if (request.method === "DELETE")
        return handleDeleteNote(userId, noteId, env);
    }
    const shareNoteMatch = path.match(/^\/api\/notes\/(.+)\/share$/);
    if (shareNoteMatch && request.method === "POST") {
      return handleUpdateNoteShare(userId, shareNoteMatch[1], request, env);
    }
    if (path === "/api/webhook/sms/latest" && request.method === "GET") {
      return handleGetLatestSmsLog(userId, env);
    }
    if (path === "/api/webhook/sms/history" && request.method === "GET") {
      return handleGetWebhookHistory(userId, env);
    }
    if (path === "/api/wallets" && request.method === "GET") {
      return handleListWallets(userId, env);
    }
    if (path === "/api/wallets" && request.method === "POST") {
      return handleCreateWallet(userId, request, env);
    }
    const walletMatch = path.match(/^\/api\/wallets\/(.+)$/);
    if (walletMatch) {
      const walletId = walletMatch[1];
      if (request.method === "PUT")
        return handleUpdateWallet(userId, walletId, request, env);
      if (request.method === "DELETE")
        return handleDeleteWallet(userId, walletId, env);
    }
    if (path === "/api/transactions" && request.method === "GET") {
      return handleListTransactions(userId, request, env);
    }
    if (path === "/api/finance/stats" && request.method === "GET") {
      return handleGetFinanceStats(userId, request, env);
    }
    if (path === "/api/transactions" && request.method === "POST") {
      return handleCreateTransaction(userId, request, env);
    }
    const txMatch = path.match(/^\/api\/transactions\/(.+)$/);
    if (txMatch && request.method === "DELETE") {
      return handleDeleteTransaction(userId, txMatch[1], env);
    }
    if (path === "/api/finance/budget" && request.method === "GET") {
      return handleGetBudget(userId, env);
    }
    if (path === "/api/finance/budget" && request.method === "PUT") {
      return handleUpdateBudget(userId, request, env);
    }
    if (path === "/api/savings" && request.method === "GET") {
      return handleListSavings(userId, env);
    }
    if (path === "/api/savings" && request.method === "POST") {
      return handleCreateSaving(userId, request, env);
    }
    const savingMatch = path.match(/^\/api\/savings\/(.+)$/);
    if (savingMatch) {
      const savingId = savingMatch[1];
    }
    const savingDepositMatch = path.match(/^\/api\/savings\/(.+)\/deposit$/);
    if (savingDepositMatch && request.method === "POST") {
      return handleDepositSaving(userId, savingDepositMatch[1], request, env);
    }
    const savingWithdrawMatch = path.match(/^\/api\/savings\/(.+)\/withdraw$/);
    if (savingWithdrawMatch && request.method === "POST") {
      return handleWithdrawSaving(userId, savingWithdrawMatch[1], request, env);
    }
    const savingIdMatch = path.match(/^\/api\/savings\/([^\/]+)$/);
    if (savingIdMatch) {
      if (request.method === "PUT")
        return handleUpdateSaving(userId, savingIdMatch[1], request, env);
      if (request.method === "DELETE")
        return handleDeleteSaving(userId, savingIdMatch[1], env);
    }
    if (path === "/api/trading/config" && request.method === "GET") {
      return handleGetTradingConfig(userId, env);
    }
    if (path === "/api/trading/config" && request.method === "PUT") {
      return handleUpdateTradingConfig(userId, request, env);
    }
    if (path === "/api/trading/checkins" && request.method === "GET") {
      return handleListTradingCheckins(userId, env);
    }
    if (path === "/api/trading/checkins" && request.method === "POST") {
      return handleCreateTradingCheckin(userId, request, env);
    }
    const tradingCheckinMatch = path.match(/^\/api\/trading\/checkins\/([\d-]+)$/);
    if (tradingCheckinMatch && request.method === "PUT") {
      return handleUpdateTradingCheckin(userId, tradingCheckinMatch[1], request, env);
    }
    if (path === "/api/pin" && request.method === "GET") {
      return handleCheckPin(userId, env);
    }
    if (path === "/api/pin" && request.method === "POST") {
      return handleSetPin(userId, request, env);
    }
    if (path === "/api/pin/verify" && request.method === "POST") {
      return handleVerifyPin(userId, request, env);
    }
    if (path === "/api/pin/forgot" && request.method === "POST") {
      return handleForgotPin(userId, request, env);
    }
    if (path === "/api/pin/reset" && request.method === "POST") {
      return handleResetPin(userId, request, env);
    }
    if (path === "/api/notifications" && request.method === "GET") {
      return handleListNotifications(userId, env);
    }
    if (path === "/api/notifications/read-all" && request.method === "POST") {
      return handleMarkAllNotificationsRead(userId, env);
    }
    if (path === "/api/notifications" && request.method === "DELETE") {
      return handleClearNotifications(userId, env);
    }
    const notiReadMatch = path.match(/^\/api\/notifications\/(.+)\/read$/);
    if (notiReadMatch && request.method === "POST") {
      return handleMarkNotificationRead(userId, notiReadMatch[1], env);
    }
    if (path === "/api/pending" && request.method === "GET") {
      return handleListPending(userId, env);
    }
    const pendingMatch = path.match(/^\/api\/pending\/(.+)\/resolve$/);
    if (pendingMatch && request.method === "POST") {
      return handleResolvePending(userId, pendingMatch[1], env);
    }
    if (path === "/api/stocks" && request.method === "GET") {
      return handleListStocks(userId, env);
    }
    if (path === "/api/stocks" && request.method === "POST") {
      return handleCreateStock(userId, request, env);
    }
    const alertMatch = path.match(/^\/api\/stocks\/([^\/]+)\/alerts$/);
    if (alertMatch && request.method === "POST") {
      return handleAddStockAlert(userId, alertMatch[1], request, env);
    }
    const alertDeleteMatch = path.match(/^\/api\/stocks\/([^\/]+)\/alerts\/([^\/]+)$/);
    if (alertDeleteMatch && request.method === "DELETE") {
      return handleDeleteStockAlert(userId, alertDeleteMatch[1], alertDeleteMatch[2], env);
    }
    const alertResetMatch = path.match(/^\/api\/stocks\/([^\/]+)\/alerts\/([^\/]+)\/reset$/);
    if (alertResetMatch && request.method === "POST") {
      return handleResetStockAlert(userId, alertResetMatch[1], alertResetMatch[2], env);
    }
    const stockMatch = path.match(/^\/api\/stocks\/([^\/]+)$/);
    if (stockMatch) {
      const stockId = stockMatch[1];
      if (request.method === "PUT")
        return handleUpdateStock(userId, stockId, request, env);
      if (request.method === "DELETE")
        return handleDeleteStock(userId, stockId, env);
    }
    if (path === "/api/funds" && request.method === "GET") {
      return handleListFunds(userId, env);
    }
    if (path === "/api/funds" && request.method === "POST") {
      return handleCreateFund(userId, request, env);
    }
    const fundMatch = path.match(/^\/api\/funds\/([^\/]+)$/);
    if (fundMatch) {
      const fundId = fundMatch[1];
      if (request.method === "PUT")
        return handleUpdateFund(userId, fundId, request, env);
      if (request.method === "DELETE")
        return handleDeleteFund(userId, fundId, env);
    }
    if (path === "/api/push/subscribe" && request.method === "POST") {
      return handlePushSubscribe(userId, request, env);
    }
    if (path === "/api/push/unsubscribe" && request.method === "POST") {
      return handlePushUnsubscribe(userId, request, env);
    }
    if (path === "/api/push/test" && request.method === "POST") {
      return handlePushTest(userId, request, env);
    }
    if (path === "/api/reminders" && request.method === "GET") {
      return handleListReminders(userId, env);
    }
    if (path === "/api/reminders" && request.method === "POST") {
      return handleCreateReminder(userId, request, env);
    }
    if (path === "/api/reminders" && request.method === "DELETE") {
      return handleClearReminders(userId, request, env);
    }
    if (path === "/api/reminders/ai-detect" && request.method === "POST") {
      return handleAiDetectReminders(userId, request, env);
    }
    const reminderMatch = path.match(/^\/api\/reminders\/([^\/]+)$/);
    if (reminderMatch) {
      const reminderId = reminderMatch[1];
      if (request.method === "PUT")
        return handleUpdateReminder(userId, reminderId, request, env);
      if (request.method === "DELETE")
        return handleDeleteReminder(userId, reminderId, env);
    }
    const reminderCompleteMatch = path.match(/^\/api\/reminders\/([^\/]+)\/complete$/);
    if (reminderCompleteMatch && request.method === "POST") {
      return handleCompleteReminder(userId, reminderCompleteMatch[1], env);
    }
    const reminderAckMatch = path.match(/^\/api\/reminders\/([^\/]+)\/acknowledge$/);
    if (reminderAckMatch && request.method === "POST") {
      return handleAcknowledgeReminder(userId, reminderAckMatch[1], env);
    }
    if (path === "/api/todos" && request.method === "GET") {
      return handleListTodos(userId, env);
    }
    if (path === "/api/todos" && request.method === "POST") {
      return handleCreateTodo(userId, request, env);
    }
    if (path === "/api/todos" && request.method === "DELETE") {
      return handleClearTodos(userId, request, env);
    }
    if (path === "/api/todos/ai-generate" && request.method === "POST") {
      return handleAiGenerateTodos(userId, request, env);
    }
    const todoMatch = path.match(/^\/api\/todos\/([^\/]+)$/);
    if (todoMatch) {
      const todoId = todoMatch[1];
      if (request.method === "PUT")
        return handleUpdateTodo(userId, todoId, request, env);
      if (request.method === "DELETE")
        return handleDeleteTodo(userId, todoId, env);
    }
    if (path === "/api/ai/stream" && request.method === "POST") {
      return handleAiStream(request, env);
    }
    if (path === "/api/ai" && request.method === "POST") {
      return handleAi(request, env);
    }
    if (path === "/api/ai/image" && request.method === "POST") {
      return handleAiImage(request, env);
    }
    return errorResponse(`Not found: ${request.method} ${path}`, 404);
  } catch (err) {
    console.error("[Worker Error]", err);
    return errorResponse(err.message || "Internal server error", 500);
  }
}
__name(handleRequest, "handleRequest");
var src_default = {
  async fetch(request, env) {
    const requestOrigin = request.headers.get("Origin");
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env, requestOrigin) });
    }
    const response = await handleRequest(request, env);
    const finalHeaders = new Headers(response.headers);
    const cors = corsHeaders(env, requestOrigin);
    for (const [key, value] of Object.entries(cors)) {
      finalHeaders.set(key, value);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: finalHeaders
    });
  },
  // ── Cloudflare Cron Trigger ──
  // Cron 1: */30 2-8 * * 1-5 = Stock alerts every 30 min during trading hours (9-15h VN, Mon-Fri)
  // Cron 2: */15 * * * * = Reminders + Trading reminders every 15 minutes
  async scheduled(event, env, ctx) {
    const cronTime = new Date(event.scheduledTime);
    const day = cronTime.getUTCDay();
    const hour = cronTime.getUTCHours();
    if (day >= 1 && day <= 5 && hour >= 2 && hour <= 8) {
      ctx.waitUntil(
        checkAllStockAlerts(env).then((result) => console.log(`[Cron] StockAlerts: ${result}`)).catch((err) => console.error("[Cron] StockAlerts failed:", err))
      );
    }
    ctx.waitUntil(
      checkAllReminders(env).then((result) => console.log(`[Cron] Reminders: ${result}`)).catch((err) => console.error("[Cron] Reminders failed:", err))
    );
    ctx.waitUntil(
      checkTradingReminders(env).then((result) => console.log(result)).catch((err) => console.error("[Cron] TradingReminder failed:", err))
    );
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-uE7A4y/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-uE7A4y/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
