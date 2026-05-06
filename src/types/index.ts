// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin';
export type Plan = 'none' | 'basic' | 'premium';
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | null;

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  plan: Plan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus;
  lifetimeAccess: boolean;
  lifetimeAccessReason: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface UserProfile {
  bio: string;
  whyICollect: string;
  yearsCollecting: string;
  favoriteBrand: string;
  favoriteEra: string;
  favoriteCarType: string;
  location: string;
  socialLinks: Record<string, string>;
  publicProfileEnabled: boolean;
  publicProfileSlug: string;
  publicValueDisplayEnabled: boolean;
  updatedAt: unknown;
}

export interface UserSettings {
  simpleChecklistMode: boolean;
  updatedAt: unknown;
}

// ─── Car / Inventory ─────────────────────────────────────────────────────────

export type Brand =
  | 'Hot Wheels'
  | 'Matchbox'
  | 'Johnny Lightning'
  | 'GreenLight'
  | 'M2 Machines'
  | 'Auto World'
  | 'Majorette'
  | 'Other';

export const BRANDS: Brand[] = [
  'Hot Wheels',
  'Matchbox',
  'Johnny Lightning',
  'GreenLight',
  'M2 Machines',
  'Auto World',
  'Majorette',
  'Other',
];

export type PackageStatus =
  | 'Carded'
  | 'Loose'
  | 'Opened but saved package'
  | 'Damaged package'
  | 'Unknown';

export const PACKAGE_STATUSES: PackageStatus[] = [
  'Carded',
  'Loose',
  'Opened but saved package',
  'Damaged package',
  'Unknown',
];

export type Condition =
  | 'Mint carded'
  | 'Carded with wear'
  | 'Loose mint'
  | 'Loose used'
  | 'Damaged'
  | 'Restored/custom'
  | 'Unknown';

export const CONDITIONS: Condition[] = [
  'Mint carded',
  'Carded with wear',
  'Loose mint',
  'Loose used',
  'Damaged',
  'Restored/custom',
  'Unknown',
];

export type RarityType =
  | 'Regular'
  | 'Mainline'
  | 'Premium'
  | 'Treasure Hunt'
  | 'Super Treasure Hunt'
  | 'Redline'
  | 'Chase'
  | 'Limited Edition'
  | 'Custom'
  | 'Unknown';

export const RARITY_TYPES: RarityType[] = [
  'Regular',
  'Mainline',
  'Premium',
  'Treasure Hunt',
  'Super Treasure Hunt',
  'Redline',
  'Chase',
  'Limited Edition',
  'Custom',
  'Unknown',
];

export type DuplicateStatus = 'Keep' | 'Sell' | 'Trade' | 'Give away';

export const DUPLICATE_STATUSES: DuplicateStatus[] = [
  'Keep',
  'Sell',
  'Trade',
  'Give away',
];

export interface Car {
  id: string;
  name: string;
  brand: Brand;
  manufacturer: string;
  releaseYear: number;
  series: string;
  setName: string;
  color: string;
  scale: string;
  condition: Condition;
  packageStatus: PackageStatus;
  rarityType: RarityType;
  quantityOwned: number;
  duplicateStatus: DuplicateStatus | null;
  storageLocation: string;
  purchasePrice: number | null;
  estimatedValue: number | null;
  notes: string;
  isFavorite: boolean;
  isShowcase: boolean;
  showcaseRank: number | null;
  isForSale: boolean;
  isForTrade: boolean;
  isWanted: boolean;
  askingPrice: number | null;
  tradeNotes: string;
  publicVisible: boolean;
  sourceChecklistId: string | null;
  sourceChecklistItemId: string | null;
  primaryPhotoUrl: string | null;
  createdAt: unknown;
  updatedAt: unknown;
  archivedAt: unknown | null;
}

export interface CarPhoto {
  id: string;
  url: string;
  storagePath: string;
  isPrimary: boolean;
  uploadedAt: unknown;
}

// ─── Wanted List ─────────────────────────────────────────────────────────────

export type WantedPriority = 'low' | 'medium' | 'high';

export interface WantedItem {
  id: string;
  name: string;
  brand: Brand;
  releaseYear: number | null;
  series: string;
  maxPrice: number | null;
  priority: WantedPriority;
  notes: string;
  found: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

// ─── Checklists ──────────────────────────────────────────────────────────────

export type ChecklistCategory =
  | 'Mainline'
  | 'Premium'
  | 'Treasure Hunt'
  | 'Super Treasure Hunt'
  | 'Car Culture'
  | 'Team Transport'
  | 'Boulevard'
  | 'Redline'
  | 'Matchbox'
  | 'Chase Cars'
  | 'Custom List'
  | 'Other';

export const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  'Mainline',
  'Premium',
  'Treasure Hunt',
  'Super Treasure Hunt',
  'Car Culture',
  'Team Transport',
  'Boulevard',
  'Redline',
  'Matchbox',
  'Chase Cars',
  'Custom List',
  'Other',
];

export interface MasterChecklist {
  id: string;
  name: string;
  brand: Brand;
  year: number;
  category: ChecklistCategory;
  description: string;
  totalCars: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface MasterChecklistItem {
  id: string;
  carName: string;
  brand: Brand;
  manufacturer: string;
  releaseYear: number;
  series: string;
  setName: string;
  collectorNumber: string;
  color: string;
  variation: string;
  rarityType: RarityType;
  notes: string;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: unknown;
  updatedAt: unknown;
}

export type ChecklistItemStatus =
  | 'need'
  | 'owned'
  | 'duplicate'
  | 'wanted'
  | 'for_sale'
  | 'for_trade'
  | 'skipped';

export interface ChecklistProgress {
  id: string;
  checklistId: string;
  checklistName: string;
  totalCars: number;
  ownedCount: number;
  neededCount: number;
  duplicateCount: number;
  completedPercent: number;
  updatedAt: unknown;
}

export interface ChecklistProgressItem {
  id: string;
  masterChecklistId: string;
  masterItemId: string;
  status: ChecklistItemStatus;
  quantityOwned: number;
  isFavorite: boolean;
  isWanted: boolean;
  isForSale: boolean;
  isForTrade: boolean;
  userNotes: string;
  linkedInventoryCarId: string | null;
  updatedAt: unknown;
}

// ─── Access / Plan ───────────────────────────────────────────────────────────

export interface PlanLimits {
  maxCars: number;
  maxPhotosPerCar: number;
  maxShowcaseCars: number;
  maxCustomChecklists: number;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface AdminLog {
  id: string;
  actorUserId: string;
  action: string;
  targetUserId: string | null;
  targetResource: string | null;
  details: Record<string, unknown>;
  createdAt: unknown;
}
