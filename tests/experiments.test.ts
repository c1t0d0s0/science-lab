import { describe, expect, it } from 'vitest';
import { initialConditions, readiness, shownVariables } from '../src/core/lab';
import { LEVELS, modeOf, type Level } from '../src/core/levels';
import { rngFromString } from '../src/core/rng';
import type { Trial } from '../src/core/snapshot';
import { EXPERIMENTS, MISSIONS, experimentById, experimentsFor, missionsFor } from '../src/experiments';
import { scaleReading } from '../src/experiments/energy/buoyancy';
import { voltage } from '../src/experiments/energy/circuit';
import { imageDistance, imageOf } from '../src/experiments/energy/convex';
import { glowTime, heatRise } from '../src/experiments/energy/electricity';
import { spotTemp } from '../src/experiments/energy/lens';
import { frequency } from '../src/experiments/energy/monochord';
import { motorCurrent } from '../src/experiments/energy/motor';
import { poleForce } from '../src/experiments/energy/poles';
import { pullForce } from '../src/experiments/energy/pulley';
import { rollDistance } from '../src/experiments/energy/slope';
import { drumSound } from '../src/experiments/energy/sound';
import { stretch } from '../src/experiments/energy/spring';
import { clips } from '../src/experiments/energy/electromagnet';
import { waterTemp } from '../src/experiments/particle/heating';
import { tilt } from '../src/experiments/energy/lever';
import { litPath } from '../src/experiments/earth/moon';
import { measurePeriod, period } from '../src/experiments/energy/pendulum';
import { grow } from '../src/experiments/life/plant';
import type { Experiment, Mission, Variable } from '../src/experiments/types';
import { assertWellFormed } from './helpers';

const valuesOf = (v: Variable) => (v.kind === 'range' ? range(v.min, v.max, v.step) : v.options.map((o) => o.value));
const range = (min: number, max: number, step: number) => Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + i * step);
const sim = (exp: Experiment, c: Record<string, number | string>) => exp.simulate({ ...initialConditions(exp), ...c });

describe('実験のしかた', () => {
  it('どの実験にも、問いの前提になる「実験のしかた」がある', () => {
    for (const exp of EXPERIMENTS) expect(exp.setup.length, exp.id).toBeGreaterThan(30);
  });

  it('1・2年生のミッションがある実験は、ひらがなの説明もある', () => {
    for (const exp of experimentsFor('g1')) expect(exp.kanaSetup, exp.id).toBeTruthy();
  });
});

describe('実験の図', () => {
  for (const exp of EXPERIMENTS) {
    it(`${exp.id}: どの条件でも、実験の前・とちゅう・あとの図が正しくかける`, () => {
      const base = initialConditions(exp);
      for (const v of exp.variables) {
        for (const value of valuesOf(v)) {
          const c = { ...base, [v.key]: value };
          const r = exp.simulate(c);
          for (const svg of [exp.scene(c, null, 0), exp.scene(c, r, 0), exp.scene(c, r, 0.37), exp.scene(c, r, 1)]) assertWellFormed(svg);
          // 結果は、はかるものの形に合っている
          if (exp.measure.kind === 'number') expect(typeof r === 'number' && Number.isFinite(r), `${exp.id} ${v.key}=${value}`).toBe(true);
          else expect(exp.measure.options.map((o) => o.value), `${exp.id} ${v.key}=${value}`).toContain(r);
        }
      }
    });
  }
});

describe('実験のきまり', () => {
  it('磁石: 鉄だけが引きつけられ、はなれすぎると引きつけない', () => {
    const m = experimentById('magnet')!;
    for (const o of ['clip', 'nail', 'steelcan']) expect(sim(m, { object: o })).toBe('yes');
    for (const o of ['alcan', 'coin10', 'coin1', 'eraser', 'paper', 'glass', 'spoon']) expect(sim(m, { object: o })).toBe('no');
    expect(sim(m, { object: 'clip', distance: 2 })).toBe('yes');
    expect(sim(m, { object: 'clip', distance: 4 })).toBe('no');
    for (const b of ['paper', 'plastic', 'wood']) expect(sim(m, { object: 'clip', between: b })).toBe('yes');
  });

  it('うく・しずむ: おもさでは決まらず、アルミはくは形で変わる', () => {
    const f = experimentById('float')!;
    expect(sim(f, { object: 'block' })).toBe('float');
    expect(sim(f, { object: 'coin' })).toBe('sink');
    expect(sim(f, { object: 'foilball' })).toBe('sink');
    expect(sim(f, { object: 'foilboat' })).toBe('float');
  });

  it('かげ: ライトと反対がわにでき、高いほど短い。太陽のかげは西→北→東', () => {
    const s = experimentById('shadow')!;
    expect(sim(s, { side: 'left' })).toMatch(/^right-/);
    expect(sim(s, { side: 'right' })).toMatch(/^left-/);
    expect(sim(s, { height: 'low' })).toMatch(/-long$/);
    expect(sim(s, { height: 'high' })).toMatch(/-short$/);
    const sun = experimentById('sunshadow')!;
    expect(['9', '12', '15'].map((t) => sim(sun, { time: t }))).toEqual(['west-long', 'north-short', 'east-long']);
  });

  it('かがみ・風・ゴム: 多いほど・強いほど・長いほど大きい', () => {
    const mi = experimentById('mirror')!;
    expect(sim(mi, { mirrors: 3 })).toBeGreaterThan(sim(mi, { mirrors: 1 }) as number);
    const w = experimentById('wind')!;
    expect(sim(w, { strength: 'strong' })).toBeGreaterThan(sim(w, { strength: 'weak' }) as number);
    expect(sim(w, { sail: 'sail' })).toBeGreaterThan(sim(w, { sail: 'none' }) as number);
    const r = experimentById('rubber')!;
    expect(sim(r, { stretch: 15 })).toBeGreaterThan(sim(r, { stretch: 10 }) as number);
    expect(sim(r, { stretch: 10, bands: 2 })).toBeGreaterThan(sim(r, { stretch: 10, bands: 1 }) as number);
  });

  it('回路: わになって金ぞくでつながるとつき、直列は明るく、へい列は同じ明るさ', () => {
    const base = { gap: 'wire', switch: 'on', batteries: 1, wiring: 'series' };
    expect(voltage(base)).toBe(1);
    expect(voltage({ ...base, gap: 'open' })).toBe(0);
    expect(voltage({ ...base, switch: 'off' })).toBe(0);
    for (const g of ['nail', 'foil', 'coin10']) expect(voltage({ ...base, gap: g })).toBe(1);
    for (const g of ['chopstick', 'eraser']) expect(voltage({ ...base, gap: g })).toBe(0);
    expect(voltage({ ...base, batteries: 2 })).toBe(2);
    expect(voltage({ ...base, batteries: 2, wiring: 'parallel' })).toBe(1);
  });

  it('ふりこ: 1往復の時間は長さだけで決まり、長さを4倍にすると2倍', () => {
    const p = experimentById('pendulum')!;
    expect(sim(p, { mass: 10 })).toBe(sim(p, { mass: 50 }));
    expect(sim(p, { amp: 10 })).toBe(sim(p, { amp: 30 }));
    expect(period(80) / period(20)).toBeCloseTo(2, 6);
    expect(measurePeriod(100)).toBeCloseTo(2.01, 2);
    // ばらつきを入れても、平均すると近い値になる
    const rng = rngFromString('pendulum');
    const avg = Array.from({ length: 200 }, () => measurePeriod(50, rng)).reduce((s, v) => s + v, 0) / 200;
    expect(Math.abs(avg - period(50))).toBeLessThan(0.01);
  });

  it('水の温度: 量が2倍で上がり方は半分、火が強いほど上がり、100℃で止まる', () => {
    expect(waterTemp(200, 'mid', 3) - 20).toBeCloseTo((waterTemp(100, 'mid', 3) - 20) / 2, 0);
    expect(waterTemp(100, 'strong', 3)).toBeGreaterThan(waterTemp(100, 'weak', 3));
    expect(waterTemp(100, 'strong', 8)).toBe(100);
    expect(waterTemp(100, 'strong', 12)).toBe(100);
  });

  it('発芽: 水・空気・適当な温度が必要で、日光はいらない。成長には日光と肥料', () => {
    const ok = { water: 'yes', air: 'yes', temp: 'warm', light: 'yes', fert: 'no' };
    expect(grow(ok)).not.toBe('none');
    expect(grow({ ...ok, water: 'no' })).toBe('none');
    expect(grow({ ...ok, air: 'no' })).toBe('none');
    expect(grow({ ...ok, temp: 'cold' })).toBe('none');
    expect(grow({ ...ok, light: 'no' })).toBe('pale');
    expect(grow({ ...ok, fert: 'yes' })).toBe('good');
    // 冷ぞう庫の実験で、室内のほうも日光を当てないようにしても、発芽する
    expect(grow({ ...ok, light: 'no', temp: 'warm' })).not.toBe('none');
  });

  it('電磁石: 巻き数・電流に比例し、鉄しんがないと弱い', () => {
    expect(clips(200, 1, 'iron')).toBe(2 * clips(100, 1, 'iron'));
    expect(clips(100, 2, 'iron')).toBe(2 * clips(100, 1, 'iron'));
    expect(clips(100, 1, 'none')).toBeLessThan(clips(100, 1, 'iron'));
  });

  it('てこ: 重さ×目もりが等しいとつり合う', () => {
    expect(tilt({ lw: 30, lp: 2, rw: 20, rp: 3 })).toBe('balance');
    expect(tilt({ lw: 30, lp: 2, rw: 30, rp: 3 })).toBe('right');
    expect(tilt({ lw: 30, lp: 2, rw: 10, rp: 3 })).toBe('left');
  });

  it('水よう液: BとCが酸性、DとEがアルカリ性。B・C・E は何も残らない', () => {
    const s = experimentById('solution')!;
    const litmus = ['A', 'B', 'C', 'D', 'E'].map((x) => sim(s, { sol: x, test: 'litmus' }));
    expect(litmus).toEqual(['neutral', 'acid', 'acid', 'alkali', 'alkali']);
    const evap = ['A', 'B', 'C', 'D', 'E'].map((x) => sim(s, { sol: x, test: 'evap' }));
    expect(evap).toEqual(['residue', 'nothing', 'nothing', 'residue', 'nothing']);
    expect(sim(s, { sol: 'C', test: 'alum' })).toBe('bubble');
  });

  it('月: 太陽と反対がわで満月、90°で右半分が光る', () => {
    const m = experimentById('moon')!;
    expect(sim(m, { angle: 180 })).toBe('full');
    expect(sim(m, { angle: 0 })).toBe('new');
    expect(sim(m, { angle: 90 })).toBe('first');
    expect(sim(m, { angle: 270 })).toBe('last');
    expect(litPath(0, 10)).toBe('');
    // 満ちていく月は、右がわ (x が正) を通る
    expect(litPath(90, 10)).toContain('0 0 1 0 10');
    expect(litPath(270, 10)).toContain('0 0 0 0 10');
  });
});

/** 学年ごとに、かならず遊べる実験 (学習指導要領の単元と、中学受験のテーマ) */
const UNITS: Partial<Record<Level, string[]>> = {
  g1: ['magnet', 'float', 'shadow', 'itodenwa'],
  g2: ['float', 'shadow', 'wind', 'slope'],
  g3: ['magnet', 'poles', 'wind', 'rubber', 'mirror', 'lens', 'drum', 'itodenwa', 'circuit', 'sunshadow'],
  g4: ['circuit', 'motor'],
  g5: ['pendulum', 'electromagnet', 'monochord', 'plant', 'heating'],
  g6: ['lever', 'pulley', 'spring', 'buoyancy', 'capacitor', 'nichrome', 'convex', 'solution', 'moon'],
};

describe('エネルギーの実験のきまり', () => {
  it('糸電話・たいこ: ぴんとはると聞こえ、強くたたくと大きい音、おさえると止まる', () => {
    const it2 = experimentById('itodenwa')!;
    expect(sim(it2, { string: 'tight', pinch: 'no' })).toBe('hear');
    expect(sim(it2, { string: 'loose' })).toBe('no');
    expect(sim(it2, { pinch: 'yes' })).toBe('no');
    expect(drumSound({ hit: 'strong', hold: 'no' })).toBe('big');
    expect(drumSound({ hit: 'weak', hold: 'no' })).toBe('small');
    expect(drumSound({ hit: 'strong', hold: 'yes' })).toBe('none');
  });

  it('さか: たかいほど・まるいほど とおくまで ころがる', () => {
    expect(rollDistance('high', 'ball')).toBeGreaterThan(rollDistance('low', 'ball'));
    expect(rollDistance('mid', 'ball')).toBeGreaterThan(rollDistance('mid', 'block'));
  });

  it('磁石の極: 同じ極はしりぞけ合い、ちがう極は引き合う', () => {
    expect(poleForce('N', 'N')).toBe('repel');
    expect(poleForce('S', 'S')).toBe('repel');
    expect(poleForce('N', 'S')).toBe('attract');
  });

  it('虫めがね: 円が小さいほど・レンズが大きいほど熱い', () => {
    expect(spotTemp('small', 'small')).toBeGreaterThan(spotTemp('mid', 'small'));
    expect(spotTemp('mid', 'small')).toBeGreaterThan(spotTemp('big', 'small'));
    expect(spotTemp('mid', 'large')).toBeGreaterThan(spotTemp('mid', 'small'));
  });

  it('モーター: 電池の向きで回る向きが変わり、直列は速く、へい列は同じ', () => {
    expect(motorCurrent({ direction: 'reverse', batteries: 1 })).toBe(-1);
    expect(motorCurrent({ batteries: 2, wiring: 'series' })).toBe(2);
    expect(motorCurrent({ batteries: 2, wiring: 'parallel' })).toBe(1);
  });

  it('モノコード: 短い・細い・強くはるほど高い音。長さ半分で2倍、おもり4倍で2倍', () => {
    expect(frequency(20, 'thin', 400)).toBe(2 * frequency(40, 'thin', 400));
    expect(frequency(40, 'thin', 400)).toBe(2 * frequency(40, 'thick', 400));
    expect(frequency(40, 'thin', 400)).toBe(2 * frequency(40, 'thin', 100));
  });

  it('かっ車・輪じく: 定かっ車は同じ、動かっ車は半分、2こで4分の1、輪じく(3:1)で3分の1', () => {
    expect(pullForce('fixed', 300)).toBe(300);
    expect(pullForce('moving', 300)).toBe(150);
    expect(pullForce('double', 400)).toBe(100);
    expect(pullForce('axle', 300)).toBe(100);
  });

  it('ばね: のびは重さに比例し、直列で2倍、へい列で半分', () => {
    expect(stretch(40, 'single')).toBe(2 * stretch(20, 'single'));
    expect(stretch(40, 'series')).toBe(2 * stretch(40, 'single'));
    expect(stretch(40, 'parallel')).toBe(stretch(40, 'single') / 2);
  });

  it('浮力: おしのけた液体の重さだけ軽くなり、体積が同じなら金ぞくによらない', () => {
    expect(scaleReading(100, 'alu', 'air') - scaleReading(100, 'alu', 'water')).toBeCloseTo(100, 6);
    expect(scaleReading(100, 'iron', 'air') - scaleReading(100, 'iron', 'water')).toBeCloseTo(100, 6);
    expect(scaleReading(100, 'alu', 'salt')).toBeLessThan(scaleReading(100, 'alu', 'water'));
  });

  it('電気の利用: 発光ダイオードは長くつき、回数に比例。電熱線は太い・短い・電流大で発熱大', () => {
    expect(glowTime(20, 'led')).toBeGreaterThan(glowTime(20, 'bulb'));
    expect(glowTime(40, 'bulb')).toBe(2 * glowTime(20, 'bulb'));
    expect(heatRise('thick', 10, 1)).toBe(2 * heatRise('thin', 10, 1));
    expect(heatRise('thin', 20, 1)).toBe(heatRise('thin', 10, 1) / 2);
    expect(heatRise('thin', 10, 2)).toBe(4 * heatRise('thin', 10, 1));
  });

  it('凸レンズ: 2倍の位置で同じ大きさ、遠いほど小さく、しょう点より内側はうつらない', () => {
    expect(imageOf(20)).toBe('same');
    expect(imageDistance(20)).toBe(20);
    expect(imageOf(40)).toBe('small');
    expect(imageOf(15)).toBe('big');
    expect(imageOf(5)).toBe('virtual');
    expect(imageDistance(40)!).toBeLessThan(imageDistance(30)!);
  });
});

/** そのミッションを、調べる条件だけを変えながら実験したときの記録 */
function playMission(m: Mission): Trial[] {
  const exp = experimentById(m.exp)!;
  const v = exp.variables.find((x) => x.key === m.need.key)!;
  const base: Record<string, number | string> = initialConditions(exp, { ...m.start, ...m.need.where });
  const values = valuesOf(v).filter((x) => !m.need.among || m.need.among.includes(x));
  const trials: Trial[] = [];
  const rng = rngFromString(m.id);
  for (const value of values) {
    for (let i = 0; i < (m.need.repeat ?? 1); i++) {
      const c = { ...base, [v.key]: value };
      trials.push({ c, v: exp.simulate(c, m.noise ? rng : undefined) });
    }
  }
  return trials;
}

describe('ミッション', () => {
  it('id は重ならない', () => {
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
  });

  for (const m of MISSIONS) {
    it(`${m.id}: 形が正しく、やりとげられる`, () => {
      const exp = experimentById(m.exp);
      expect(exp, m.exp).toBeDefined();
      const keys = exp!.variables.map((v) => v.key);
      expect(m.levels.length).toBeGreaterThan(0);
      expect(m.choices.length).toBeGreaterThanOrEqual(2);
      expect(new Set(m.choices).size).toBe(m.choices.length);
      expect(m.answer >= 0 && m.answer < m.choices.length).toBe(true);
      expect(keys).toContain(m.need.key);
      if (m.target) expect(keys).toContain(m.target);
      for (const k of [...(m.show ?? []), ...(m.lock ?? []), ...Object.keys(m.start ?? {}), ...Object.keys(m.need.where ?? {})]) expect(keys).toContain(k);
      // 調べる条件は動かせて、画面に出ている
      expect(m.lock ?? []).not.toContain(m.need.key);
      expect(shownVariables(exp!, m).map((v) => v.key)).toContain(m.need.key);
      if (m.conclusions) {
        expect(m.conclusions.filter((c) => c.ok).length).toBe(1);
        expect(m.levels).toEqual(['g6']);
      }
      if (m.need.result === undefined) {
        for (const level of m.levels) {
          const trials = playMission(m);
          const shown = shownVariables(exp!, m).map((v) => v.key);
          expect(readiness(m.need, trials, modeOf(level), shown).ready, `${m.id} ${level}`).toBe(true);
        }
      }
    });
  }

  it('予想の正解が、実験の結果と合っている (数ではかるミッション)', () => {
    const expected: Record<string, 'up' | 'down' | 'flat'> = {
      'pendulum-length': 'up',
      'pendulum-mass': 'flat',
      'pendulum-amp': 'flat',
      'heating-amount': 'down',
      'heating-fire': 'up',
      'em-turns': 'up',
      'em-current': 'up',
      'rubber-stretch': 'up',
      'rubber-bands': 'up',
      'mirror-count': 'up',
      'mono-length': 'down',
      'mono-tension': 'up',
      'nichrome-length': 'down',
      'lens-spot': 'up',
    };
    for (const [id, dir] of Object.entries(expected)) {
      const m = MISSIONS.find((x) => x.id === id)!;
      const t = playMission({ ...m, noise: false });
      const first = t[0].v as number;
      const last = t[t.length - 1].v as number;
      const got = last > first ? 'up' : last < first ? 'down' : 'flat';
      expect(got, id).toBe(dir);
    }
  });

  it('受験の発展ミッションは 5・6 年生だけ', () => {
    for (const m of MISSIONS.filter((x) => x.exam)) for (const l of m.levels) expect(['g5', 'g6'], m.id).toContain(l);
  });

  it('学習指導要領の単元 (と受験のテーマ) に、それぞれ実験がある', () => {
    for (const [level, ids] of Object.entries(UNITS)) {
      const have = experimentsFor(level as Level).map((e) => e.id);
      for (const id of ids) expect(have, `${level} ${id}`).toContain(id);
    }
  });

  it('どの学年にも、4つ以上の実験と8つ以上のミッションがある', () => {
    for (const level of LEVELS) {
      expect(experimentsFor(level).length, level).toBeGreaterThanOrEqual(4);
      expect(missionsFor(level).length, level).toBeGreaterThanOrEqual(8);
    }
  });

  it('仮説・検証のミッションは 6 年生だけで、ばらつきがあるものは何回ずつかはかる', () => {
    for (const m of MISSIONS.filter((x) => x.noise)) {
      expect(m.levels).toEqual(['g6']);
      expect(m.need.repeat ?? 0).toBeGreaterThanOrEqual(2);
    }
  });
});
