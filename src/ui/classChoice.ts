/** Sentinels for `ClassRadios`: the "New" radio, and "No class". */
export const NEW = '\u0000new';
export const NONE = '';

/** The class chosen in `ClassRadios`. */
export interface ClassChoice { choice: string; text: string }

export const initialClassChoice = (className: string | undefined): ClassChoice => ({ choice: className ?? NONE, text: '' });

/** The class a choice stands for, or an error message when "New" is picked but blank. */
export function resolveClassChoice(c: ClassChoice): { className?: string; error?: string } {
  if (c.choice !== NEW) return { className: c.choice || undefined };
  if (!c.text.trim()) return { error: 'Enter a class name.' };
  return { className: c.text };
}
