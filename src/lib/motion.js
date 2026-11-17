// The one bit of motion that needs JavaScript: a short shake on the field that stopped a submit, so the
// eye finds it. It runs through the browser's own animate() (no library), only for a failed submit, never
// while typing, and not at all for someone who asked their system for less motion.
//   shake(document.getElementById('start'))
export function shake(element) {
  if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const steps = ['0', '-10px', '10px', '-6px', '6px', '-3px', '0'].map((x) => ({ translate: `${x} 0` }));
  element.animate(steps, { duration: 360, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
}
