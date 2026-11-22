import motion from '../probes/motion';
import tags from '../probes/tags';
import tech from '../probes/tech';
import vitals from '../probes/vitals';
import type { ProbeName } from '../tools/types';

export type ProbeFunction = (...args: never[]) => unknown;

export const PROBES: Record<ProbeName, ProbeFunction> = { tech, tags, motion, vitals };
