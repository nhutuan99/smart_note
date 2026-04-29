var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/base64-arraybuffer/dist/base64-arraybuffer.es5.js
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

// node_modules/@block65/webcrypto-web-push/dist/lib/utils.js
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

// node_modules/@block65/webcrypto-web-push/dist/lib/cf-jwt/jwt-algorithms.js
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

// node_modules/@block65/custom-error/dist/lib/custom-error.js
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

// src/index.ts
var DEFAULT_WALLETS = [
  { name: "Ng\xE2n h\xE0ng", balance: 0, currency: "VND", icon: "\u{1F3E6}", color: "#3b82f6", order: 0 },
  { name: "V\xED \u0111i\u1EC7n t\u1EED", balance: 0, currency: "VND", icon: "\u{1F4F1}", color: "#8b5cf6", order: 1 },
  { name: "Ti\u1EC1n m\u1EB7t", balance: 0, currency: "VND", icon: "\u{1F4B5}", color: "#10b981", order: 2 }
];
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
__name(generateId, "generateId");
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Webhook-Secret",
    "Content-Type": "application/json"
  };
}
__name(corsHeaders, "corsHeaders");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}
__name(errorResponse, "errorResponse");
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
async function createJWT(payload, secret) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(
    JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1e3 })
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
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${header}.${body}.${sig}`;
}
__name(createJWT, "createJWT");
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
      Uint8Array.from(atob(sig), (c) => c.charCodeAt(0)),
      encoder.encode(`${header}.${body}`)
    );
    if (!valid)
      return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp < Date.now())
      return null;
    return payload;
  } catch {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
async function getJSON(kv, key) {
  return kv.get(key, "json");
}
__name(getJSON, "getJSON");
async function putJSON(kv, key, data) {
  await kv.put(key, JSON.stringify(data));
}
__name(putJSON, "putJSON");
async function handleRegister(request, env) {
  const { email, password, name } = await request.json();
  if (!email || !password)
    return errorResponse("Email and password required");
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
  return jsonResponse({
    success: true,
    data: {
      token,
      user: {
        id,
        email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
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
  return jsonResponse({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      }
    }
  });
}
__name(handleLogin, "handleLogin");
async function handleUpdateProfile(userId, request, env) {
  const { name, avatarUrl } = await request.json();
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
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/profile`, user);
  return jsonResponse({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || "",
      createdAt: user.createdAt
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
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
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
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
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
  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    console.error("[GOOGLE_OAUTH] Token exchange failed:", errorBody);
    return errorResponse("X\xE1c minh Google th\u1EA5t b\u1EA1i. Vui l\xF2ng th\u1EED l\u1EA1i.", 400);
  }
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  if (!accessToken)
    return errorResponse("No access token from Google", 400);
  const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!userInfoResponse.ok) {
    return errorResponse("Kh\xF4ng th\u1EC3 l\u1EA5y th\xF4ng tin t\u1EEB Google", 400);
  }
  const googleUser = await userInfoResponse.json();
  if (!googleUser.email || !googleUser.verified_email) {
    return errorResponse("Email Google ch\u01B0a \u0111\u01B0\u1EE3c x\xE1c minh", 400);
  }
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
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return errorResponse("Google OAuth not configured", 503);
  }
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
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
  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    console.error("[GOOGLE_SIGNIN] Token exchange failed:", errorBody);
    return errorResponse("\u0110\u0103ng nh\u1EADp Google th\u1EA5t b\u1EA1i. Vui l\xF2ng th\u1EED l\u1EA1i.", 400);
  }
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  if (!accessToken)
    return errorResponse("No access token from Google", 400);
  const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!userInfoResponse.ok) {
    return errorResponse("Kh\xF4ng th\u1EC3 l\u1EA5y th\xF4ng tin t\u1EEB Google", 400);
  }
  const googleUser = await userInfoResponse.json();
  if (!googleUser.email || !googleUser.verified_email) {
    return errorResponse("Email Google ch\u01B0a \u0111\u01B0\u1EE3c x\xE1c minh", 400);
  }
  const email = googleUser.email.toLowerCase();
  const usersIndex = await getJSON(env.SMART_NOTE_KV, "users/_index") || {};
  let userId = usersIndex[email];
  let isNewUser = false;
  if (userId) {
    const user = await getJSON(env.SMART_NOTE_KV, `users/${userId}/profile`);
    if (!user)
      return errorResponse("User not found", 404);
    if (!user.avatarUrl && googleUser.picture) {
      user.avatarUrl = googleUser.picture;
      await putJSON(env.SMART_NOTE_KV, `users/${userId}/profile`, user);
    }
    const token = await createJWT({ userId: user.id }, env.JWT_SECRET);
    return jsonResponse({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt
        },
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
    const defaultWallets = DEFAULT_WALLETS.map((w) => ({
      ...w,
      id: generateId()
    }));
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`, defaultWallets);
    await putJSON(env.SMART_NOTE_KV, `users/${userId}/finance/transactions`, []);
    const token = await createJWT({ userId }, env.JWT_SECRET);
    return jsonResponse({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt
        },
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
  if (hash !== user.passwordHash) {
    return errorResponse("M\u1EADt kh\u1EA9u kh\xF4ng ch\xEDnh x\xE1c", 400);
  }
  const resetToken = generateId() + generateId();
  const resetTokenHash = await hashPassword(resetToken);
  await env.SMART_NOTE_KV.put(`users/${userId}/otp/pin_reset_token`, resetTokenHash, { expirationTtl: 900 });
  return jsonResponse({ success: true, data: { resetToken } });
}
__name(handleForgotPin, "handleForgotPin");
async function handleResetPin(userId, request, env) {
  const { resetToken, newPin } = await request.json();
  if (!resetToken || !newPin)
    return errorResponse("Missing required fields");
  if (!newPin || newPin.length !== 4 || !/^\d+$/.test(newPin)) {
    return errorResponse("PIN ph\u1EA3i l\xE0 4 ch\u1EEF s\u1ED1");
  }
  const storedTokenHash = await env.SMART_NOTE_KV.get(`users/${userId}/otp/pin_reset_token`);
  if (!storedTokenHash)
    return errorResponse("Phi\xEAn \u0111\u1EB7t l\u1EA1i PIN \u0111\xE3 h\u1EBFt h\u1EA1n. Vui l\xF2ng th\u1EED l\u1EA1i.", 400);
  const inputHash = await hashPassword(resetToken);
  if (inputHash !== storedTokenHash)
    return errorResponse("Reset token kh\xF4ng h\u1EE3p l\u1EC7", 400);
  const pinHash = await hashPassword(newPin);
  await putJSON(env.SMART_NOTE_KV, `users/${userId}/pin`, pinHash);
  await env.SMART_NOTE_KV.delete(`users/${userId}/otp/pin_reset_token`);
  return jsonResponse({ success: true, message: "PIN \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\u1EB7t l\u1EA1i th\xE0nh c\xF4ng" });
}
__name(handleResetPin, "handleResetPin");
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
    ...body,
    id: noteId,
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
    order: wallets.length
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
  wallets[idx] = { ...wallets[idx], ...body, id: walletId };
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
async function handleListTransactions(userId, env) {
  const txs = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/finance/transactions`
  ) || [];
  return jsonResponse({ success: true, data: txs });
}
__name(handleListTransactions, "handleListTransactions");
async function handleCreateTransaction(userId, request, env) {
  const body = await request.json();
  const txs = await getJSON(
    env.SMART_NOTE_KV,
    `users/${userId}/finance/transactions`
  ) || [];
  const wallets = await getJSON(env.SMART_NOTE_KV, `users/${userId}/finance/wallets`) || [];
  const tx = {
    id: generateId(),
    type: body.type,
    amount: body.amount,
    category: body.category,
    note: body.note || "",
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
  const contentType = request.headers.get("content-type") || "";
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
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
        const raw = body?.text ?? body?.message ?? body?.body ?? body?.content ?? body?.sms ?? "";
        const text = typeof raw === "string" ? raw : raw?.body ?? raw?.content ?? raw?.text ?? JSON.stringify(raw);
        const senderHint = (body?.sender ?? body?.from ?? body?.bank ?? "").toString().trim();
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
- N\u1EBFu c\xE2u h\u1ECFi kh\xF4ng li\xEAn quan \u0111\u1EBFn t\xE0i ch\xEDnh, l\u1ECBch s\u1EF1 t\u1EEB ch\u1ED1i v\xE0 nh\u1EAFc l\u1EA1i vai tr\xF2`
};
async function handleAi(request, env) {
  if (!env.AI)
    return errorResponse("AI binding not configured", 503);
  const body = await request.json();
  const { action, content, question } = body;
  if (!action)
    return errorResponse("Missing action");
  if (!content && action !== "ask")
    return errorResponse("Note content is required");
  if (action === "ask" && !question)
    return errorResponse("Missing question");
  const systemPrompt = AI_SYSTEM_PROMPTS[action];
  if (!systemPrompt)
    return errorResponse(`Unknown action: ${action}`);
  let userMessage;
  if (action === "finance") {
    userMessage = content;
  } else if (action === "ask") {
    userMessage = content ? `Note content:
${content}

Question: ${question}` : `Question: ${question}`;
  } else if (action === "tags") {
    userMessage = `Title: ${body.title || ""}
Content: ${content.substring(0, 600)}`;
  } else {
    userMessage = content;
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
  const { action, content, question } = body;
  if (!action)
    return errorResponse("Missing action");
  if (!content && action !== "ask")
    return errorResponse("Note content is required");
  if (action === "ask" && !question)
    return errorResponse("Missing question");
  const systemPrompt = AI_SYSTEM_PROMPTS[action];
  if (!systemPrompt)
    return errorResponse(`Unknown action: ${action}`);
  let userMessage;
  if (action === "finance") {
    userMessage = content;
  } else if (action === "ask") {
    userMessage = content ? `Note content:
${content}

Question: ${question}` : `Question: ${question}`;
  } else if (action === "tags") {
    userMessage = `Title: ${body.title || ""}
Content: ${content.substring(0, 600)}`;
  } else {
    userMessage = content;
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
    const cors = corsHeaders();
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
      await fetch("https://api.resend.com/emails", {
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
var src_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    const url = new URL(request.url);
    const path = url.pathname;
    try {
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
      if (path === "/api/webhook/telegram" && request.method === "POST") {
        return handleTelegramWebhook(request, env);
      }
      if (path === "/api/webhook/notification" && request.method === "POST") {
        return handleNotificationWebhook(request, env);
      }
      if (path === "/api/webhook/sms" && request.method === "POST") {
        return handleSmsWebhook(request, env);
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
      if (path === "/api/report-bug" && request.method === "POST") {
        return handleReportBug(userId, request, env);
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
        return handleListTransactions(userId, env);
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
      if (path === "/api/push/subscribe" && request.method === "POST") {
        return handlePushSubscribe(userId, request, env);
      }
      if (path === "/api/push/unsubscribe" && request.method === "POST") {
        return handlePushUnsubscribe(userId, request, env);
      }
      if (path === "/api/push/test" && request.method === "POST") {
        return handlePushTest(userId, request, env);
      }
      if (path === "/api/ai/stream" && request.method === "POST") {
        return handleAiStream(request, env);
      }
      if (path === "/api/ai" && request.method === "POST") {
        return handleAi(request, env);
      }
      return errorResponse("Not found", 404);
    } catch (err) {
      return errorResponse(err.message || "Internal error", 500);
    }
  }
};
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
