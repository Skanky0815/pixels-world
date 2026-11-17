export type InputDirection = 'left' | 'right' | 'up' | 'down';
export type KeyboardAction = InputDirection | 'jump' | 'reset';

const BINDINGS = [
  { code: 'ArrowLeft', key: 'LEFT', action: 'left', wasd: false },
  { code: 'ArrowRight', key: 'RIGHT', action: 'right', wasd: false },
  { code: 'ArrowUp', key: 'UP', action: 'up', wasd: false },
  { code: 'ArrowDown', key: 'DOWN', action: 'down', wasd: false },
  { code: 'Space', key: 'SPACE', action: 'jump', wasd: false },
  { code: 'KeyR', key: 'R', action: 'reset', wasd: false },
  { code: 'KeyA', key: 'A', action: 'left', wasd: true },
  { code: 'KeyD', key: 'D', action: 'right', wasd: true },
  { code: 'KeyW', key: 'W', action: 'up', wasd: true },
  { code: 'KeyS', key: 'S', action: 'down', wasd: true },
] as const;

export function keyboardBindings(wasd: boolean) {
  return BINDINGS.filter((binding) => !binding.wasd || wasd);
}

export function directionForCode(code: string, wasd: boolean): InputDirection | undefined {
  const action = keyboardBindings(wasd).find((binding) => binding.code === code)?.action;

  return action === 'jump' || action === 'reset' ? undefined : action;
}
