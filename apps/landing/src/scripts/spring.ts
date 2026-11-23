export interface Spring {
  value: number;
  velocity: number;
  target: number;
  stiffness: number;
  damping: number;
}

const MAX_STEP = 1 / 60;

export function createSpring(initial: number, stiffness = 400, damping = 40): Spring {
  return { value: initial, velocity: 0, target: initial, stiffness, damping };
}

export function stepSpring(spring: Spring, deltaSeconds: number): boolean {
  let remaining = Math.min(deltaSeconds, 0.1);
  while (remaining > 0) {
    const step = Math.min(remaining, MAX_STEP);
    const force =
      spring.stiffness * (spring.target - spring.value) - spring.damping * spring.velocity;
    spring.velocity += force * step;
    spring.value += spring.velocity * step;
    remaining -= step;
  }
  const isSettled =
    Math.abs(spring.target - spring.value) < 0.001 && Math.abs(spring.velocity) < 0.001;
  if (isSettled) {
    spring.value = spring.target;
    spring.velocity = 0;
  }
  return !isSettled;
}

export function snapSpring(spring: Spring, value: number): void {
  spring.value = value;
  spring.target = value;
  spring.velocity = 0;
}
