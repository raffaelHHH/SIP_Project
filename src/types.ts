// To add a language: add its code here, then create src/i18n/<code>.ts.
export type Lang = 'en' | 'zh';

// Text in the data files. English is required; other languages fall back to English.
export type Localized = { en: string } & Partial<Record<Lang, string>>;

export type AgeGroup = '2-4' | '5-8' | '9-12';

export type Category = 'playground' | 'park' | 'garden' | 'library' | 'cc' | 'event';

export type Feature =
  | 'sheltered'
  | 'toilet'
  | 'lit'
  | 'awayFromRoad'
  | 'fenced'
  | 'water'
  | 'wheelchair';

export type Skill = 'motor' | 'thinking' | 'nature' | 'social' | 'language';

export interface Spot {
  id: string;
  name: Localized;
  category: Category;
  neighbourhood: string;
  lat: number;
  lng: number;
  /** "24h", "check" (= "Check on site"), or custom text. */
  hours: '24h' | 'check' | Localized;
  features: Feature[];
  verified: boolean;
  /** Suggested by a parent and approved by the team (comes from the database, not spots.json). */
  community?: boolean;
}

export interface ActivityStep {
  icon: string;
  text: Localized;
}

export interface Activity {
  id: string;
  icon: string;
  title: Localized;
  ages: AgeGroup[];
  minutes: number;
  skills: Skill[];
  /** null means "Nothing needed". */
  needs: Localized | null;
  /** Spot categories this works at. "any" = works almost anywhere outdoors. */
  places: (Category | 'any')[];
  steps: ActivityStep[];
}

export interface Neighbourhood {
  id: string;
  name: Localized;
  lat: number;
  lng: number;
}

export interface Resource {
  id: string;
  icon: string;
  name: Localized;
  desc: Localized;
  url: string;
}
