/** Semantic animation keys; #88 supplies the final frames behind this contract. */
export const SARA_ANIMATIONS = {
  enter: 'sara-enter',
  idle: 'sara-idle',
  calm: 'sara-react-calm',
  annoyed: 'sara-react-annoyed',
  angry: 'sara-react-angry',
} as const;

export const SARA_DIALOGUE = {
  calm: [
    'Du sitzt erstaunlich unauffällig da, Pixel.',
    'Fast alles steht noch. Ich nehme das als Kompliment.',
    'Ich war weg. Du warst brav. Eine dieser Aussagen stimmt sicher.',
  ],
  annoyed: [
    'Ah. Du hast umdekoriert. Ohne Rücksprache, wie immer.',
    'Das Sofa hatte vorher weniger Persönlichkeit.',
    'Pixel. Wir haben sehr unterschiedliche Vorstellungen von Ordnung.',
  ],
  angry: [
    '… Ich stelle die Tasche erst mal ab.',
    'Das war ein Wohnzimmer. Ich bin ziemlich sicher.',
    'Pixel. Bitte sag mir, dass wenigstens die Nachbarn noch stehen.',
  ],
} as const;
