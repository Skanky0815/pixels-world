export const PICTURE_MOTIFS = ['pixel', 'berlin', 'cozy', 'poster-space', 'poster-arcade'] as const;
export type PictureMotif = (typeof PICTURE_MOTIFS)[number];
