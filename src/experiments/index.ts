import type { Level } from '../core/levels';
import { moon, moonMissions } from './earth/moon';
import { sunshadow, sunshadowMissions } from './earth/sunshadow';
import { buoyancy, buoyancyMissions } from './energy/buoyancy';
import { circuit, circuitMissions } from './energy/circuit';
import { convex, convexMissions } from './energy/convex';
import { capacitor, electricityMissions, nichrome } from './energy/electricity';
import { electromagnet, electromagnetMissions, empole, empoleMissions } from './energy/electromagnet';
import { lens, lensMissions } from './energy/lens';
import { lever, leverMissions } from './energy/lever';
import { lightMissions, mirror, shadow } from './energy/light';
import { magnet, magnetMissions } from './energy/magnet';
import { monochord, monochordMissions } from './energy/monochord';
import { motionMissions, rubber, wind } from './energy/motion';
import { motor, motorMissions } from './energy/motor';
import { pendulum, pendulumMissions } from './energy/pendulum';
import { poles, polesMissions } from './energy/poles';
import { pulley, pulleyMissions } from './energy/pulley';
import { slope, slopeMissions } from './energy/slope';
import { drum, itodenwa, soundMissions } from './energy/sound';
import { spring, springMissions } from './energy/spring';
import { plant, plantMissions } from './life/plant';
import { combustion, combustionMissions, gascheck } from './particle/combustion';
import { dissolve, dissolveMissions } from './particle/dissolve';
import { float, floatMissions } from './particle/float';
import { heating, heatingMissions } from './particle/heating';
import { ice, iceMissions } from './particle/ice';
import { gasamount, gasmake, neutralize, reactionMissions } from './particle/reaction';
import { solution, solutionMissions } from './particle/solution';
import { syringe, syringeMissions } from './particle/syringe';
import { conduction, expansion, states, thermalMissions } from './particle/thermal';
import { weight, weightMissions } from './particle/weight';
import type { Experiment, Field, Mission } from './types';

/** 全部の実験。学年のページでは、分野ごとに、この順でならべる */
export const EXPERIMENTS: Experiment[] = [
  // エネルギー
  magnet,
  shadow,
  itodenwa,
  wind,
  slope,
  poles,
  mirror,
  lens,
  drum,
  rubber,
  circuit,
  motor,
  pendulum,
  electromagnet,
  empole,
  monochord,
  lever,
  pulley,
  spring,
  buoyancy,
  capacitor,
  nichrome,
  convex,
  // 粒子
  float,
  ice,
  weight,
  syringe,
  expansion,
  conduction,
  states,
  heating,
  dissolve,
  combustion,
  gascheck,
  solution,
  neutralize,
  gasmake,
  gasamount,
  // 生命
  plant,
  // 地球
  sunshadow,
  moon,
];

export const MISSIONS: Mission[] = [
  ...magnetMissions,
  ...floatMissions,
  ...lightMissions,
  ...sunshadowMissions,
  ...motionMissions,
  ...circuitMissions,
  ...heatingMissions,
  ...pendulumMissions,
  ...plantMissions,
  ...electromagnetMissions,
  ...leverMissions,
  ...solutionMissions,
  ...moonMissions,
  ...soundMissions,
  ...slopeMissions,
  ...polesMissions,
  ...lensMissions,
  ...motorMissions,
  ...monochordMissions,
  ...pulleyMissions,
  ...springMissions,
  ...buoyancyMissions,
  ...electricityMissions,
  ...convexMissions,
  ...empoleMissions,
  ...iceMissions,
  ...weightMissions,
  ...syringeMissions,
  ...thermalMissions,
  ...dissolveMissions,
  ...combustionMissions,
  ...reactionMissions,
];

export const FIELDS: readonly Field[] = ['energy', 'particle', 'life', 'earth'];

export const experimentById = (id: string) => EXPERIMENTS.find((e) => e.id === id);
export const missionById = (id: string) => MISSIONS.find((m) => m.id === id);

export const missionsFor = (level: Level, exp?: string) => MISSIONS.filter((m) => m.levels.includes(level) && (!exp || m.exp === exp));

/** その学年で遊べる実験 (ミッションがあるもの) */
export const experimentsFor = (level: Level) => EXPERIMENTS.filter((e) => MISSIONS.some((m) => m.exp === e.id && m.levels.includes(level)));

/** ミッションの中身が変わったかを見分ける印 (途中経過の sig に使う) */
export const missionSig = (m: Mission) => `${m.id}:${m.choices.length}:${m.answer}`;
