import { InjectionToken } from '@angular/core';

/** The save toggle's accessible names, from the application's catalogue (save-toggle CRD D-3). */
export interface SaveToggleText {
  /** "Save {name} to your saved artists". */
  save(name: string): string;
  /** "Remove {name} from your saved artists". */
  remove(name: string): string;
  /** "and", which replaces " & " in a spoken name. */
  and: string;
}

export const SAVE_TOGGLE_TEXT = new InjectionToken<SaveToggleText>('SaveToggleText');
