/** Each objective set is frozen; expanding the room list adds a new achievement version. */
export const ACHIEVEMENT_ROOMS_V1 = [
  { id: 'living-room', name: { de: 'Wohnzimmer', en: 'Living room' } },
] as const;
export const ACHIEVEMENT_ROOMS = [
  ...ACHIEVEMENT_ROOMS_V1,
  { id: 'kitchen', name: { de: 'Küche', en: 'Kitchen' } },
] as const;
const levels = [
  { id: 'easy', de: 'Leicht', en: 'Easy' },
  { id: 'normal', de: 'Normal', en: 'Normal' },
  { id: 'hard', de: 'Schwer', en: 'Hard' },
] as const;

export const ROOM_ACHIEVEMENTS_V1 = [
  ...levels.map((level) => ({
    id: `achievement.rooms-${level.id}-v1`,
    name: { de: `Alle Räume – ${level.de}`, en: `All rooms – ${level.en}` },
    description: {
      de: `Alle Räume der ersten Sammlung (Wohnzimmer) auf ${level.de} erfolgreich abschließen.`,
      en: `Reach the goal and successfully finish the first collection (living room) on ${level.en}.`,
    },
    targets: ACHIEVEMENT_ROOMS_V1.map((room) => `${level.id}/${room.id}`),
  })),
  ...ACHIEVEMENT_ROOMS_V1.map((room) => ({
    id: `achievement.peaceful-${room.id}-v1`,
    name: { de: `Sanfte Pfoten – ${room.name.de}`, en: `Gentle paws – ${room.name.en}` },
    description: {
      de: `${room.name.de} auf Schwer schaffen, ohne etwas zu beschädigen.`,
      en: `Complete ${room.name.en} on Hard without damaging anything.`,
    },
    targets: [`hard-peaceful/${room.id}`],
  })),
];
export const ROOM_ACHIEVEMENTS_V2 = [
  ...levels.map((level) => ({
    id: `achievement.rooms-${level.id}-v2`,
    name: { de: `Alle Räume II – ${level.de}`, en: `All rooms II – ${level.en}` },
    description: {
      de: `Wohnzimmer und Küche auf ${level.de} mit erreichtem Hauptziel erfolgreich abschließen.`,
      en: `Reach the main goal and successfully finish the living room and kitchen on ${level.en}.`,
    },
    targets: ACHIEVEMENT_ROOMS.map((room) => `${level.id}/${room.id}`),
  })),
  {
    id: 'achievement.peaceful-kitchen-v1',
    name: { de: 'Sanfte Pfoten – Küche', en: 'Gentle paws – Kitchen' },
    description: {
      de: 'Die Küche auf Schwer schaffen, ohne etwas zu beschädigen.',
      en: 'Complete the kitchen on Hard without damaging anything.',
    },
    targets: ['hard-peaceful/kitchen'],
  },
];
export const ROOM_ACHIEVEMENTS = [...ROOM_ACHIEVEMENTS_V1, ...ROOM_ACHIEVEMENTS_V2];
export const ROOM_COMPLETIONS = ROOM_ACHIEVEMENTS.flatMap((entry) => entry.targets);
