import { CabinetVisit, CABINET_VISIT_RULES } from './cabinet-visit.ts';
import type { CabinetVisitRules } from './cabinet-visit.ts';

export const FRIDGE_RULES = { ...CABINET_VISIT_RULES, points: 24 } as const;

/** Fridge-specific scoring; door phases and capture belong to the shared cabinet mechanism. */
export class FridgeRummaging extends CabinetVisit {
  constructor(id: string, rules: CabinetVisitRules = FRIDGE_RULES) {
    super(id, rules);
  }
}
