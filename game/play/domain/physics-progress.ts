/** Detached body position sampled after actual collision-resolved physics steps. */
export interface PhysicsProgress {
  readonly step: number;
  readonly x: number;
  readonly y: number;
}
