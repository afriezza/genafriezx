import crypto from "crypto";
import https from "node:https";
import zlib from "node:zlib";
import { detectRare } from "./patterns.js";

const agent = new https.Agent({ keepAlive: true, family: 4, maxSockets: 64, keepAliveMsecs: 30000 });

function newIp() {
  for (;;) {
    const a = 1 + Math.floor(Math.random() * 223);
    const b = Math.floor(Math.random() * 256);
    const c = Math.floor(Math.random() * 256);
    const d = 1 + Math.floor(Math.random() * 254);
    if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) continue;
    return `${a}.${b}.${c}.${d}`;
  }
}

const ipPool = Array.from({ length: 20000 }, newIp);
let ipIndex = 0;
const nextIp = () => ipPool[ipIndex++ % ipPool.length];

const HEX_KEY = "2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3";
const AES_KEY = Buffer.from([89,103,38,116,99,37,68,69,117,104,54,37,90,99,94,56]);
const AES_IV = Buffer.from([54,111,121,90,68,114,50,50,69,51,121,99,104,106,77,37]);
const KEYSTREAM = Buffer.from([48,48,48,50,48,49,55,48,48,48,48,48,50,48,49,55,48,48,48,48,48,50,48,49,55,48,48,48,48,48,50,48]);
const FIELD_22 = Buffer.from("4747524501010100620200001052aa0d669c6a368f08338060d2ee0690053af84a41edcd3558556ec10f24f46c93ac64ca41a16732c46a2cb071246a79b8929032f9e1b6f4ef331bd53cabf29b09b97349a46e9863c0314e1a0d80819fef8aabf03876b3d037db354a7ccb5c1bce96411fb3753f6f50e44c69c4ed617fa30efb8ffc0517ff2f636739be1f304d999cfd6fd48bf69454199794c3dc88f55a4bdbd66534d5a061359cdfd1fb680cd37918df9fdb3cf7d80067b0a3506c90063cf62b2ccec11e23913a2fd7c4ef091331967bb518a5ad1e551146b90821be800883abadde39d6c80a5d798611466c748f075481806c5842ce45e6bd4e3368ec08fe2ec41ceb880cd86249eb71693f79f0bccf9e590c3fae12519fe08c7a1905d0927690109e0df28574bb14847225db1a59230e6662ed7730e15ff9a6c815cb41b420edeada735a4b03e181037c37c2c850257311df2f07b0a56e759372cbd0268e3f13a292ee4373e38ab5096e0342a5e0d7fec6da2bbc265d74baadd2b24ee4f74862f82c21d6694bac53f8ce80312a30068a6276a641c19b11d0305c6fe2f531ac7de578b29f543697f5c73663e6f23aa15277b6122dcd4d4171e38f9ac0b173f39c58416a16c5c1f4a35acd065ce78f449cf538a249339e763272d458e4ed86c976591a9c066b3a37111e44091eb6b5a795249f3e5145db022a6055f2cc675936391312f688f89627845df222a91156555225be36f9714a0ba50246d0f003bda3c9c1292ab73b4f79635ddd023218eda93a302d79e023404c14396544a930b98ed54771aca7fec10d095587685b473e81a9619764fad9256529dcd6e911f4f4629612287d4ee3ec5389f6ec4ec020b0e2aac017232a9197be9e46239ce690fe5d4872b2e98e651510c971667f3aca8b59f3e9d50e43", "hex");
const X_GA_SV = "1789535859";
const RELEASE = "OB55";
const REGISTER_URL = "https://100067.connect.garena.com/api/v2/oauth/guest:register";
const GRANT_URL = "https://100067.connect.garena.com/api/v2/oauth/guest/token:grant";
const MAJOR_REGISTER_URL = "https://loginbp.ppmainecoonghj.com/MajorRegister";
const MAJOR_LOGIN_URL = "https://loginbp.ppmainecoonghj.com/MajorLogin";
const BIND_URL = "https://loginbp.ppmainecoonghj.com/ChooseNewbieChoice";

const REGION_LANG = {
  ME: "ar", IND: "hi", ID: "id", JP: "ja", VN: "vi", TH: "th", BD: "bn",
  PK: "ur", TW: "zh", CIS: "ru", SAC: "es", BR: "pt", SG: "en", US: "en",
  EU: "en", LK: "en",
};

const UAS = [
  "GarenaMSDK/4.0.44(25028RN03A ;Android 15;id;ID;app 1.132.1 2019121229;)",
  "GarenaMSDK/4.0.43(25028RN03A ;Android 14;id;ID;app 1.131.1 2019121229;)",
  "GarenaMSDK/4.0.45(25028RN03A ;Android 13;id;ID;app 1.133.1 2019121229;)",
];

const DEVICES = [
  ["Asus ASUS_AI2501_B", "Android OS 12 / API-31 (SP1A.210812.016.C2)", "Adreno (TM) 640"],
  ["Redmi Note 12 Pro", "Android OS 13 / API-33 (TP1A.220624.014)", "Adreno (TM) 618"],
  ["Samsung SM-M135F", "Android OS 13 / API-33 (TP1A.220624.014)", "Mali-G68"],
  ["Realme RMX3630", "Android OS 12 / API-31 (SP1A.210812.016)", "Adreno (TM) 610"],
  ["Vivo V2149", "Android OS 13 / API-33 (TP1A.220624.014)", "Adreno (TM) 642L"],
];

const RAMS = [5951, 6000, 6100, 5500, 6500];
const REFRESH = [19788, 20000, 21000];

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const pickUA = () => rnd(UAS);

function spoofIP() {
  for (;;) {
    const a = 1 + Math.floor(Math.random() * 222);
    const b = Math.floor(Math.random() * 256);
    const c = Math.floor(Math.random() * 256);
    const d = 1 + Math.floor(Math.random() * 254);
    if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) continue;
    return `${a}.${b}.${c}.${d}`;
  }
}

function varint(n) {
  n = Number(n);
  const out = [];
  for (;;) {
    const b = n & 0x7f;
    n = Math.floor(n / 128);
    if (n) out.push(b | 0x80);
    else { out.push(b); break; }
  }
  return Buffer.from(out);
}

function pbField(k, v) {
  if (Buffer.isBuffer(v)) return Buffer.concat([varint((k << 3) | 2), varint(v.length), v]);
  if (typeof v === "number" && Number.isInteger(v)) return Buffer.concat([varint((k << 3) | 0), varint(v)]);
  const b = Buffer.from(String(v), "utf8");
  return Buffer.concat([varint((k << 3) | 2), varint(b.length), b]);
}

function pb(obj) {
  const parts = [];
  for (const k of Object.keys(obj)) parts.push(pbField(Number(k), obj[k]));
  return Buffer.concat(parts);
}

function aesCbc(buf) {
  const c = crypto.createCipheriv("aes-128-cbc", AES_KEY, AES_IV);
  return Buffer.concat([c.update(buf), c.final()]);
}

function xorField(openId) {
  const ob = Buffer.from(openId, "latin1");
  const out = Buffer.alloc(ob.length);
  for (let i = 0; i < ob.length; i++) out[i] = ob[i] ^ KEYSTREAM[i % KEYSTREAM.length];
  return out;
}

function postOnce(url, headers, body, ms) {
  const ip = nextIp();
  return new Promise((resolve) => {
    const u = new URL(url);
    let settled = false;
    const finish = (r) => { if (!settled) { settled = true; resolve(r); } };
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: "POST",
      family: 4,
      agent,
      headers: {
        ...headers,
        "Accept-Encoding": "deflate, gzip",
        Connection: "keep-alive",
        "X-Forwarded-For": ip,
        "X-Real-IP": ip,
        "CF-Connecting-IP": ip,
        "X-Client-IP": ip,
      },
    }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        let buf = Buffer.concat(chunks);
        const enc = String(res.headers["content-encoding"] || "");
        try {
          if (enc.includes("gzip")) buf = zlib.gunzipSync(buf);
          else if (enc.includes("deflate")) buf = zlib.inflateSync(buf);
        } catch {}
        finish({ status: res.statusCode || 0, buf });
      });
    });
    req.setTimeout(ms, () => { req.destroy(new Error("timeout")); });
    req.on("error", () => finish({ status: 0, buf: Buffer.alloc(0) }));
    req.write(body);
    req.end();
  });
}

async function post(url, headers, body, ms = 8000) {
  const r = await postOnce(url, headers, body, ms);
  if (r.status !== 0) return r;
  return postOnce(url, headers, body, ms);
}

function makeDevice() {
  const d = rnd(DEVICES);
  return {
    model: d[0],
    os_string: d[1],
    gpu: d[2],
    ip: spoofIP(),
    device_id: "Google|" + crypto.randomUUID(),
  };
}

const REGISTER_MAX = 24;
let registerSlots = 8;
let registerBusy = 0;
let registerOkStreak = 0;
let registerNextAt = 0;
let register429Streak = 0;
let drainedUntil = 0;
const registerWaiters = [];

async function acquireRegister() {
  for (;;) {
    const wait = registerNextAt - Date.now();
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
      continue;
    }
    if (registerBusy < registerSlots) {
      registerBusy++;
      return;
    }
    await new Promise((resolve) => registerWaiters.push(resolve));
  }
}

function releaseRegister(status) {
  if (status === 429) {
    registerOkStreak = 0;
    register429Streak++;
    if (register429Streak >= 3) drainedUntil = Date.now() + 20000;
    registerSlots = Math.max(4, Math.floor(registerSlots / 2));
    registerNextAt = Date.now() + 400 + Math.random() * 400;
  } else if (status === 200) {
    registerOkStreak++;
    register429Streak = 0;
    if (registerOkStreak >= 4 && registerSlots < REGISTER_MAX) {
      registerOkStreak = 0;
      registerSlots++;
    }
  } else {
    registerOkStreak = 0;
  }
  registerBusy--;
  let free = registerSlots - registerBusy;
  while (free > 0 && registerWaiters.length) {
    registerWaiters.shift()();
    free--;
  }
}

async function guestRegister(password) {
  const body = JSON.stringify({ app_id: 100067, client_type: 2, password, source: 2 });
  const sig = crypto.createHmac("sha256", HEX_KEY).update(body).digest("hex");
  await acquireRegister();
  let status = 0;
  try {
    const r = await post(REGISTER_URL, {
      "User-Agent": pickUA(),
      Accept: "application/json",
      Authorization: "Signature " + sig,
      "Content-Type": "application/json; charset=utf-8",
    }, body);
    status = r.status;
    if (r.status === 429) return { rate: true };
    if (r.status !== 200) return null;
    try {
      const j = JSON.parse(r.buf.toString("utf8"));
      return j.code === 0 && j.data && j.data.uid ? { uid: j.data.uid } : null;
    } catch {
      return null;
    }
  } finally {
    releaseRegister(status);
  }
}

async function tokenGrant(uid, password) {
  const body = JSON.stringify({
    client_id: 100067,
    client_secret: HEX_KEY,
    client_type: 2,
    device_id: "02-" + crypto.randomUUID(),
    password,
    response_type: "token",
    uid,
  });
  const r = await post(GRANT_URL, {
    "User-Agent": pickUA(),
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8",
  }, body);
  if (r.status !== 200) return null;
  try {
    const j = JSON.parse(r.buf.toString("utf8"));
    if (j.code === 0 && j.data && j.data.access_token) {
      return { access_token: j.data.access_token, open_id: j.data.open_id };
    }
    return null;
  } catch {
    return null;
  }
}

async function majorLogin(accessToken, openId, lang) {
  const device = makeDevice();
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const fields = {
    3: now, 4: "free fire", 5: 4, 7: "1.132.1", 8: "2019116753",
    9: device.os_string, 10: "Handheld", 11: device.model,
    12: 1280, 13: 720, 14: "240",
    15: "x86-64 SSE3 SSE4.1 SSE4.2 AVX AVX2 | 2400 | 4",
    16: rnd(RAMS), 17: device.gpu, 18: "OpenGL ES 3.1 v1.46",
    19: device.device_id, 20: device.ip, 21: lang,
    22: openId, 23: "4", 24: "Handheld", 25: device.model,
    26: "ID", 29: accessToken, 30: 1,
    41: "Telkomsel", 42: "WIFI",
    92: rnd(REFRESH), 93: "android_max", 97: 1, 98: 1, 99: "4", 100: "4",
    104: 77149, 105: 1,
  };
  const r = await post(MAJOR_LOGIN_URL, {
    "User-Agent": pickUA(),
    "X-GA-SV": X_GA_SV,
    Authorization: "Bearer " + accessToken,
    "X-GA": "v1 1",
    ReleaseVersion: RELEASE,
    "Content-Type": "application/octet-stream",
    "X-Unity-Version": "2018.4.12f1",
  }, aesCbc(pb(fields)));
  if (r.status !== 200 || r.buf.length < 20) return null;
  const text = r.buf.toString("utf8");
  let jwt = null;
  const m = text.match(/eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/);
  if (m) jwt = m[0];
  let accountId = null;
  if (jwt) {
    try {
      const p = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"));
      accountId = p.account_id || p.external_id || p.uid || null;
    } catch {}
  }
  if (!accountId) {
    const nums = text.match(/\b\d{10,12}\b/);
    if (nums) accountId = nums[0];
  }
  if (!accountId) return null;
  return { account_id: String(accountId), jwt_token: jwt || "" };
}

async function majorRegister(accessToken, openId, nick, lang) {
  const payload = {
    1: nick, 2: accessToken, 3: openId,
    5: 102000007, 6: 4, 7: 1, 13: 1,
    14: xorField(openId), 15: lang, 16: 1, 17: 1, 22: FIELD_22,
  };
  const r = await post(MAJOR_REGISTER_URL, {
    "User-Agent": pickUA(),
    "X-GA-SV": X_GA_SV,
    Authorization: "Bearer",
    "X-GA": "v1 1",
    ReleaseVersion: RELEASE,
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Unity-Version": "2018.4.12f1",
  }, aesCbc(pb(payload)));
  if (r.status !== 200 || !r.buf.length) return null;
  return majorLogin(accessToken, openId, lang);
}

async function bindRegion(region, jwt) {
  const rc = region === "CIS" ? "RU" : region;
  await post(BIND_URL, {
    "User-Agent": "UnityPlayer/2018.4.12f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)",
    "X-GA-SV": X_GA_SV,
    Authorization: "Bearer " + jwt,
    "X-GA": "v1 1",
    ReleaseVersion: RELEASE,
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Unity-Version": "2018.4.12f1",
  }, aesCbc(pb({ 1: rc })));
}

export async function createOne(opts = {}) {
  const region = String(opts.region || "ID").toUpperCase();
  const name = String(opts.name || "AFZX");
  const pwPrefix = String(opts.password_prefix || "");
  const ghost = !!opts.ghost;
  const bind = !!opts.bind;
  const detect = opts.detect_rare !== false;
  const started = Date.now();
  const password = pwPrefix + crypto.randomBytes(16).toString("hex");
  const delays = [0, 300, 700, 1400, 2200];
  let uid = "";
  let g = null;
  for (let i = 0; i < delays.length && !g; i++) {
    if (Date.now() < drainedUntil) break;
    if (delays[i]) await new Promise((r) => setTimeout(r, delays[i] + Math.random() * 300));
    const reg = await guestRegister(password);
    if (!reg) continue;
    if (reg.rate) break;
    uid = reg.uid;
    g = await tokenGrant(uid, password);
  }
  if (!g) return null;
  const lang = REGION_LANG[region] || "en";
  let nick = "";
  let res = null;
  for (let i = 0; i < 4 && !res; i++) {
    nick = name.slice(0, 4).toUpperCase() + String(1000 + Math.floor(Math.random() * 9000));
    res = await majorRegister(g.access_token, g.open_id, nick, lang);
  }
  if (!res) return null;
  if (bind && !ghost) await bindRegion(region, res.jwt_token);
  return {
    uid: String(uid),
    password,
    name: nick,
    nickname: nick,
    region: ghost ? "GHOST" : region,
    account_id: res.account_id,
    jwt_token: res.jwt_token,
    access_token: g.access_token,
    open_id: g.open_id,
    rare: detect ? detectRare(String(uid)) : [],
    ghost,
    ms: Date.now() - started,
  };
}

async function runPool(tasks, limit, out = new Array(tasks.length).fill(null)) {
  let i = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, tasks.length)) }, async () => {
    for (;;) {
      const idx = i++;
      if (idx >= tasks.length) return;
      try {
        out[idx] = await tasks[idx]();
      } catch {
        out[idx] = null;
      }
    }
  });
  await Promise.all(workers);
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (Date.now() < drainedUntil) {
    return res.status(200).json({ success: true, accounts: [], drained: true, ms_total: 0 });
  }
  const q = req.query || {};
  const count = Math.min(Math.max(parseInt(q.count, 10) || 1, 1), 50);
  const concurrency = Math.min(Math.max(parseInt(q.concurrency, 10) || 50, 1), 50);
  const opts = {
    region: q.region || "ID",
    name: q.name || "AFZX",
    password_prefix: q.password_prefix || q.password || "",
    ghost: String(q.ghost).toLowerCase() === "true" || String(q.ghost) === "1",
    bind: String(q.bind).toLowerCase() === "true",
    detect_rare: String(q.detect_rare).toLowerCase() !== "false",
  };
  const started = Date.now();
  const results = new Array(count).fill(null);
  const tasks = Array.from({ length: count }, () => () => createOne(opts));
  const deadline = count === 1 ? 4400 : count <= 5 ? 8600 : 55000;
  await Promise.race([runPool(tasks, concurrency, results), new Promise((r) => setTimeout(r, deadline))]);
  const accounts = results.filter(Boolean);
  return res.status(200).json({
    success: true,
    engine: "live",
    total_requested: count,
    total_created: accounts.length,
    attempts_made: count,
    rare_count: accounts.filter((a) => a.rare && a.rare.length).length,
    ms_total: Date.now() - started,
    accounts,
  });
}
