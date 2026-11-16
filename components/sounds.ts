let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// لازم ينادى من حدث للمستخدم (ضغطة) عشان المتصفح يسمح بالصوت
export function unlockAudio() {
  getCtx();
}

export function setMuted(value: boolean) {
  muted = value;
}

function run(fn: (c: AudioContext) => void) {
  if (muted) return;
  const c = getCtx();
  if (c) fn(c);
}

// نغمة (نقرة، ضربة، رنّة)
function tone(
  c: AudioContext,
  o: {
    freq: number;
    freqEnd?: number;
    at?: number;
    dur: number;
    vol: number;
    type?: OscillatorType;
  }
) {
  const t0 = c.currentTime + (o.at ?? 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.freqEnd) {
    osc.frequency.exponentialRampToValueAtTime(o.freqEnd, t0 + o.dur);
  }
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(o.vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

// ضجيج مفلتر (whoosh، swish)
function noise(
  c: AudioContext,
  o: {
    at?: number;
    dur: number;
    vol: number;
    type: BiquadFilterType;
    from: number;
    to: number;
    q?: number;
  }
) {
  const t0 = c.currentTime + (o.at ?? 0);
  const length = Math.floor(c.sampleRate * (o.dur + 0.1));
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = o.type;
  filter.Q.value = o.q ?? 1;
  filter.frequency.setValueAtTime(o.from, t0);
  filter.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(o.vol, t0 + o.dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t0);
  src.stop(t0 + o.dur + 0.05);
}

export const sounds = {
  // نقرة خفيفة لما تمسك الملف
  grab() {
    run((c) =>
      tone(c, { freq: 900, freqEnd: 500, dur: 0.06, vol: 0.12, type: "triangle" })
    );
  },

  // whoosh وقت الطيران (المدة بتتطابق مع مدة الحركة)
  throw(duration: number) {
    run((c) =>
      noise(c, {
        dur: duration,
        vol: 0.25,
        type: "bandpass",
        from: 500,
        to: 3000,
        q: 0.8,
      })
    );
  },

  // ضربة عند الحلقة
  rim() {
    run((c) => {
      tone(c, { freq: 260, freqEnd: 110, dur: 0.12, vol: 0.4 });
      noise(c, { dur: 0.05, vol: 0.12, type: "highpass", from: 2000, to: 2000 });
    });
  },

  // نفخة الشبكة
  swish() {
    run((c) =>
      noise(c, {
        at: 0.03,
        dur: 0.45,
        vol: 0.18,
        type: "highpass",
        from: 3500,
        to: 6000,
        q: 0.5,
      })
    );
  },

  // نغمة النجاح (نغمتين)
  success() {
    run((c) => {
      tone(c, { freq: 1318, dur: 0.5, vol: 0.2 });
      tone(c, { freq: 1760, at: 0.09, dur: 0.7, vol: 0.2 });
    });
  },
};