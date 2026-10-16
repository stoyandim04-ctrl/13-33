import type { Stage } from "./stage";

/** Единствената сцена — секциите ѝ казват hover/завъртане/трус. */
export const stageRef: { current: Stage | null } = { current: null };
