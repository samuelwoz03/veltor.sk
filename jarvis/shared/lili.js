// Lili: slovenský hlas, ktorý beží priamo v prehliadači (open source Piper, model sk_SK-lili-medium).
// Model sa stiahne raz (asi 60 MB) a prehliadač si ho uloží. Nič sa nikam neposiela a nič to nestojí.
import { createPiperPhonemize } from "./piper-phonemize.js";

const MODEL = "https://huggingface.co/diffusionstudio/piper-voices/resolve/main/sk/sk_SK/lili/medium/sk_SK-lili-medium.onnx";
const ORT_BASE = "https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/";
const PHONEMIZE = "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize";
const CACHE_NAME = "jarvis-lili-v1";

let loading = null;
let session = null;
let config = null;
let phonemizer = null;
let printTarget = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Nepodarilo sa načítať " + src));
    document.head.appendChild(s);
  });
}

async function cachedFetch(url, onProgress) {
  let cache = null;
  try {
    cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(url);
    if (hit) return await hit.arrayBuffer();
  } catch (e) { cache = null; }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Sťahovanie zlyhalo: " + res.status);
  const total = Number(res.headers.get("content-length")) || 0;
  const chunks = [];
  let loaded = 0;
  if (res.body && res.body.getReader) {
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      if (onProgress) onProgress(loaded, total);
    }
  } else {
    chunks.push(new Uint8Array(await res.arrayBuffer()));
  }
  const blob = new Blob(chunks);
  if (cache) { try { await cache.put(url, new Response(blob)); } catch (e) {} }
  return await blob.arrayBuffer();
}

export function isCached() {
  return caches.open(CACHE_NAME).then((c) => c.match(MODEL)).then((r) => !!r).catch(() => false);
}

export function load(onProgress) {
  if (!loading) {
    loading = (async () => {
      if (!window.ort) await loadScript(ORT_BASE + "ort.min.js");
      window.ort.env.wasm.wasmPaths = ORT_BASE;
      window.ort.env.wasm.numThreads = 1;
      config = JSON.parse(new TextDecoder().decode(await cachedFetch(MODEL + ".json")));
      const model = await cachedFetch(MODEL, onProgress);
      session = await window.ort.InferenceSession.create(model);
    })().catch((e) => { loading = null; throw e; });
  }
  return loading;
}

async function getPhonemizer() {
  if (!phonemizer) {
    phonemizer = createPiperPhonemize({
      print: (line) => { if (printTarget) printTarget(line); },
      printErr: () => {},
      noExitRuntime: true,
      locateFile: (f) => f.endsWith(".wasm") ? PHONEMIZE + ".wasm" : f.endsWith(".data") ? PHONEMIZE + ".data" : f
    }).catch((e) => { phonemizer = null; throw e; });
  }
  return phonemizer;
}

export async function phonemize(text, voice) {
  const mod = await getPhonemizer();
  return await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { printTarget = null; reject(new Error("Fonémy nevrátili výsledok")); }, 10000);
    printTarget = (line) => {
      try {
        const ids = JSON.parse(line).phoneme_ids;
        clearTimeout(timer);
        printTarget = null;
        resolve(ids);
      } catch (e) { /* iný výpis, čakáme ďalej */ }
    };
    try {
      mod.callMain(["-l", voice || (config && config.espeak.voice) || "sk", "--input", JSON.stringify([{ text: text }]), "--espeak_data", "/espeak-ng-data"]);
    } catch (e) {
      clearTimeout(timer);
      printTarget = null;
      reject(e);
    }
  });
}

function toWav(samples, rate) {
  const n = samples.length;
  const buf = new DataView(new ArrayBuffer(44 + n * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) buf.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); buf.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt ");
  buf.setUint32(16, 16, true); buf.setUint16(20, 1, true); buf.setUint16(22, 1, true);
  buf.setUint32(24, rate, true); buf.setUint32(28, rate * 2, true); buf.setUint16(32, 2, true); buf.setUint16(34, 16, true);
  w(36, "data"); buf.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf.buffer], { type: "audio/wav" });
}

// Jedna veta -> WAV. Tempo 0.95 = o kúsok svižnejšie ako predvolené.
export async function synth(text) {
  await load();
  const ids = await phonemize(String(text).trim());
  const ort = window.ort;
  const inf = config.inference || {};
  const feeds = {
    input: new ort.Tensor("int64", BigInt64Array.from(ids.map((x) => BigInt(x))), [1, ids.length]),
    input_lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(ids.length)]), [1]),
    scales: new ort.Tensor("float32", Float32Array.from([inf.noise_scale ?? 0.667, (inf.length_scale ?? 1) * 0.95, inf.noise_w ?? 0.8]), [3])
  };
  if (config.num_speakers > 1) feeds.sid = new ort.Tensor("int64", BigInt64Array.from([0n]), [1]);
  const out = await session.run(feeds);
  return toWav(out.output.data, config.audio.sample_rate);
}
