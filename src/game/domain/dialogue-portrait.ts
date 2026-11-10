import type { HomecomingSnapshot } from './homecoming.ts';
import type { ReconciliationSnapshot } from './reconciliation.ts';

export type DialoguePortrait =
  'sara-neutral' | 'sara-surprised' | 'sara-annoyed' | 'sara-friendly' | 'pixel-neutral';

export function homecomingPortrait(snapshot: HomecomingSnapshot): DialoguePortrait | null {
  if (snapshot.selection?.peaceful) return 'sara-friendly';

  return regularHomecomingPortrait(snapshot);
}

function regularHomecomingPortrait(snapshot: HomecomingSnapshot): DialoguePortrait | null {
  if (snapshot.stage === 'waiting') return null;

  if (snapshot.stage === 'complete') return 'pixel-neutral';

  if (snapshot.stage === 'entering') return 'sara-neutral';

  if (snapshot.selection?.anger === 'calm') return 'sara-neutral';

  return snapshot.stage === 'reacting' ? 'sara-surprised' : 'sara-annoyed';
}

export function charmPortrait(snapshot: ReconciliationSnapshot): DialoguePortrait | null {
  if (snapshot.stage === 'waiting') return null;

  if (snapshot.stage === 'failed') return 'sara-annoyed';

  if (snapshot.stage === 'finale' || snapshot.stage === 'complete') return 'sara-friendly';

  if (snapshot.stage !== 'feedback') return 'pixel-neutral';

  return snapshot.feedback === 'sequence' ? 'sara-friendly' : 'sara-neutral';
}
