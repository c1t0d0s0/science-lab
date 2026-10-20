import type { Level } from '../core/levels';
import { circuit, circuitMissions } from './circuit';
import { electromagnet, electromagnetMissions } from './electromagnet';
import { float, floatMissions } from './float';
import { heating, heatingMissions } from './heating';
import { lever, leverMissions } from './lever';
import { lightMissions, mirror, shadow, sunshadow } from './light';
import { magnet, magnetMissions } from './magnet';
import { moon, moonMissions } from './moon';
import { motionMissions, rubber, wind } from './motion';
import { pendulum, pendulumMissions } from './pendulum';
import { plant, plantMissions } from './plant';
import { solution, solutionMissions } from './solution';
import type { Experiment, Mission } from './types';

/** 全部の実験 (一覧に出す順) */
export const EXPERIMENTS: Experiment[] = [
  magnet,
  float,
  shadow,
  wind,
  sunshadow,
  mirror,
  rubber,
  circuit,
  heating,
  pendulum,
  plant,
  electromagnet,
  lever,
  solution,
  moon,
];

export const MISSIONS: Mission[] = [
  ...magnetMissions,
  ...floatMissions,
  ...lightMissions,
  ...motionMissions,
  ...circuitMissions,
  ...heatingMissions,
  ...pendulumMissions,
  ...plantMissions,
  ...electromagnetMissions,
  ...leverMissions,
  ...solutionMissions,
  ...moonMissions,
];

export const experimentById = (id: string) => EXPERIMENTS.find((e) => e.id === id);
export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);

export const missionsFor = (level: Level, exp?: string) => MISSIONS.filter((m) => m.levels.includes(level) && (!exp || m.exp === exp));

/** その学年で遊べる実験 (ミッションがあるもの) */
export const experimentsFor = (level: Level) => EXPERIMENTS.filter((e) => MISSIONS.some((m) => m.exp === e.id && m.levels.includes(level)));

/** ミッションの中身が変わったかを見分ける印 (途中経過の sig に使う) */
export const missionSig = (m: Mission) => `${m.id}:${m.choices.length}:${m.answer}`;
