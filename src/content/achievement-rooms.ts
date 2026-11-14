/** Released goal set; new rooms require a new set without revoking existing unlocks. */
export const ACHIEVEMENT_ROOMS = [
  { id: 'living-room', name: { de: 'Wohnzimmer', en: 'Living room' } },
] as const;
const levels = [
  { id: 'easy', de: 'Leicht', en: 'Easy' },
  { id: 'normal', de: 'Normal', en: 'Normal' },
  { id: 'hard', de: 'Schwer', en: 'Hard' },
] as const;

export const ROOM_ACHIEVEMENTS = [
  ...levels.map((level) => ({
    id: `achievement.rooms-${level.id}-v1`,
    name: { de: `Alle Räume – ${level.de}`, en: `All rooms – ${level.en}` },
    description: {
      de: `In allen aktuell spielbaren Räumen auf ${level.de} das Ziel erreichen und die Runde erfolgreich abschließen.`,
      en: `Reach the goal and successfully finish every currently playable room on ${level.en}.`,
    },
    targets: ACHIEVEMENT_ROOMS.map((room) => `${level.id}/${room.id}`),
  })),
  ...ACHIEVEMENT_ROOMS.map((room) => ({
    id: `achievement.peaceful-${room.id}-v1`,
    name: { de: `Sanfte Pfoten – ${room.name.de}`, en: `Gentle paws – ${room.name.en}` },
    description: {
      de: `${room.name.de} auf Schwer schaffen, ohne etwas zu beschädigen.`,
      en: `Complete ${room.name.en} on Hard without damaging anything.`,
    },
    targets: [`hard-peaceful/${room.id}`],
  })),
];
export const ROOM_COMPLETIONS = ROOM_ACHIEVEMENTS.flatMap((entry) => entry.targets);
