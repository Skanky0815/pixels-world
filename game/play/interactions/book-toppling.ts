import { Toppling, type TopplingRules } from './toppling.ts';
export type BookRules = TopplingRules;
export const BOOK_TOPPLE = { warningMs: 1000, fallMs: 450, points: 12 } as const;

/** Shared tipping lifecycle; preserve established book rules and state names. */
export class BookToppling extends Toppling<'stacked'> {
  constructor(id: string, rules: BookRules = BOOK_TOPPLE) {
    super(id, rules, 'topple', 'stacked');
  }
}
