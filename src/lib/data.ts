import { useMemo } from 'react';
import type { Activity, AgeGroup, Category, Feature, Neighbourhood, Resource, Skill, Spot } from '../types';
import { useStore } from './store';
import spotsJson from '../data/spots.json';
import activitiesJson from '../data/activities.json';
import neighbourhoodsJson from '../data/neighbourhoods.json';
import resourcesJson from '../data/resources.json';

export const spots = spotsJson as Spot[];
export const activities = activitiesJson as Activity[];
export const neighbourhoods = neighbourhoodsJson as Neighbourhood[];
export const resources = resourcesJson as Resource[];

export const spotById = new Map(spots.map((s) => [s.id, s]));
export const activityById = new Map(activities.map((a) => [a.id, a]));
export const neighbourhoodById = new Map(neighbourhoods.map((n) => [n.id, n]));

/** All places: the team's list plus approved places suggested by parents. */
export function useSpots(): Spot[] {
  const community = useStore((s) => s.communitySpots);
  return useMemo(() => [...spots, ...community], [community]);
}

export function useSpot(id: string): Spot | undefined {
  const community = useStore((s) => s.communitySpots);
  return spotById.get(id) ?? community.find((s) => s.id === id);
}

export const ageGroups: AgeGroup[] = ['2-4', '5-8', '9-12'];
export const categories: Category[] = ['playground', 'park', 'garden', 'library', 'cc', 'event'];
export const features: Feature[] = ['sheltered', 'toilet', 'lit', 'awayFromRoad', 'fenced', 'water', 'wheelchair'];
export const skills: Skill[] = ['motor', 'thinking', 'nature', 'social', 'language'];

export const categoryIcon: Record<Category, string> = {
  playground: '🤸',
  park: '🌳',
  garden: '🌺',
  library: '📚',
  cc: '🏠',
  event: '🎪',
};

export const featureIcon: Record<Feature, string> = {
  sheltered: '☂️',
  toilet: '🚻',
  lit: '💡',
  awayFromRoad: '🚸',
  fenced: '🚧',
  water: '🚰',
  wheelchair: '♿',
};

export const skillIcon: Record<Skill, string> = {
  motor: '🏃',
  thinking: '🧠',
  nature: '🌿',
  social: '🤝',
  language: '💬',
};

export const ageKey = { '2-4': 'age_2_4', '5-8': 'age_5_8', '9-12': 'age_9_12' } as const;

/** Activities that suit a spot and the child's age. Place-specific ones come first. */
export function activitiesForSpot(spot: Spot, age: AgeGroup, max = 4): Activity[] {
  const fit = activities.filter((a) => a.ages.includes(age));
  const specific = fit.filter((a) => a.places.includes(spot.category));
  const general = fit.filter((a) => a.places.includes('any') && !specific.includes(a));
  // Rotate by spot so different places suggest different activities.
  const offset = [...spot.id].reduce((n, c) => n + c.charCodeAt(0), 0);
  const rotate = <T,>(xs: T[]) => (xs.length ? xs.map((_, i) => xs[(i + offset) % xs.length]) : xs);
  return [...rotate(specific), ...rotate(general)].slice(0, max);
}
