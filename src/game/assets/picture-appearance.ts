export const PICTURE_MOTIFS = ['pixel', 'berlin', 'cozy'] as const;
export type PictureMotif = (typeof PICTURE_MOTIFS)[number];
