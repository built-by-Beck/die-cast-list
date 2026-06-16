// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin";
export type Plan = "none" | "free" | "basic" | "premium";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "past_due"
  | "unpaid"
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
  | "Hot Wheels"
  | "Matchbox"
  | "Johnny Lightning"
  | "GreenLight"
  | "M2 Machines"
  | "Auto World"
  | "Majorette"
  | "Other";

export const BRANDS: Brand[] = [
  "Hot Wheels",
  "Matchbox",
  "Johnny Lightning",
  "GreenLight",
  "M2 Machines",
  "Auto World",
  "Majorette",
  "Other",
];

export type PackageStatus =
  | "Carded"
  | "Loose"
  | "Opened but saved package"
  | "Damaged package"
  | "Unknown";

export const PACKAGE_STATUSES: PackageStatus[] = [
  "Carded",
  "Loose",
  "Opened but saved package",
  "Damaged package",
  "Unknown",
];

export type Condition =
  | "Mint carded"
  | "Carded with wear"
  | "Loose mint"
  | "Loose used"
  | "Damaged"
  | "Restored/custom"
  | "Unknown";

export const CONDITIONS: Condition[] = [
  "Mint carded",
  "Carded with wear",
  "Loose mint",
  "Loose used",
  "Damaged",
  "Restored/custom",
  "Unknown",
];

export type RarityType =
  | "Regular"
  | "Mainline"
  | "Premium"
  | "Treasure Hunt"
  | "Super Treasure Hunt"
  | "Redline"
  | "Chase"
  | "Limited Edition"
  | "Custom"
  | "Unknown";

export const RARITY_TYPES: RarityType[] = [
  "Regular",
  "Mainline",
  "Premium",
  "Treasure Hunt",
  "Super Treasure Hunt",
  "Redline",
  "Chase",
  "Limited Edition",
  "Custom",
  "Unknown",
];

export type DuplicateStatus = "Keep" | "Sell" | "Trade" | "Give away";

export const DUPLICATE_STATUSES: DuplicateStatus[] = [
  "Keep",
  "Sell",
  "Trade",
  "Give away",
];

// Status for checklist-item duplicates (snake_case to match Firestore)
export type DuplicateItemStatus =
  | "keep"
  | "sell"
  | "trade"
  | "give_away"
  | "unknown";

export interface Car {
  id: string;
  name: string;
  brand: Brand;
  manufacturer: string;
  releaseYear: number;
  series: string;
  setName: string;
  // Checklist linkage fields
  toyNumber: string;
  collectorNumber: string;
  seriesNumber: string;
  color: string;
  scale: string;
  condition: Condition;
  packageStatus: PackageStatus;
  rarityType: RarityType;
  quantityOwned: number;
  duplicateCount: number;
  duplicateStatus: DuplicateItemStatus | null;
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

export type WantedPriority = "low" | "medium" | "high";

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
  | "Mainline"
  | "Premium"
  | "Treasure Hunt"
  | "Super Treasure Hunt"
  | "Car Culture"
  | "Team Transport"
  | "Boulevard"
  | "Redline"
  | "Matchbox"
  | "Chase Cars"
  | "Custom List"
  | "Other";

export const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  "Mainline",
  "Premium",
  "Treasure Hunt",
  "Super Treasure Hunt",
  "Car Culture",
  "Team Transport",
  "Boulevard",
  "Redline",
  "Matchbox",
  "Chase Cars",
  "Custom List",
  "Other",
];

export interface MasterChecklist {
  id: string;
  brandId?: string;
  brandName?: string;
  name: string;
  brand: Brand;
  year: number;
  category: ChecklistCategory;
  description: string;
  // Checklist source data may require attribution depending on source license. Do not remove attribution fields.
  sourceName: string;
  sourceUrl: string;
  sourceLicense: string;
  sourceAttribution: string;
  totalCars: number;
  uniqueSeries: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: unknown;
  updatedAt: unknown;
  archivedAt: unknown | null;
}

// Required columns from the spec — these MUST be stored and displayed:
// toyNumber, collectorNumber, modelName, seriesName, seriesNumber
export interface MasterChecklistItem {
  id: string;
  brandId?: string;
  year?: number;
  toyNumber: string; // Toy # (e.g. "001", "TH1")
  collectorNumber: string; // Col.# (e.g. "1/250")
  modelName: string; // Model Name
  seriesName: string; // Series (e.g. "HW Dream Garage")
  seriesNumber: string; // Series # (e.g. "1/10")
  photoUrl: string | null;
  imageRef: string | null;
  variationLabel: string;
  rarityType: RarityType;
  notes: string;
  sortOrder: number;
  normalizedSearchText: string;
  // Auto-detected import metadata (optional, backward-compatible).
  tags?: string[];
  isTreasureHunt?: boolean;
  isSuperTreasureHunt?: boolean;
  isExclusive?: boolean;
  exclusiveStore?: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

// Status is COMPUTED from quantityOwned — do not set manually
export type ChecklistItemStatus = "need" | "owned" | "duplicate";

export interface ChecklistProgress {
  id: string;
  brandId?: string;
  checklistId: string;
  checklistName: string;
  brand: string;
  year: number;
  totalCars: number;
  ownedCount: number;
  neededCount: number;
  duplicateItemCount: number; // items where quantityOwned > 1
  totalDuplicateCount: number; // sum of (quantityOwned - 1) across all items
  completedPercent: number;
  lastOpenedAt: unknown;
  updatedAt: unknown;
}

export interface ChecklistProgressItem {
  id: string;
  masterChecklistId: string;
  masterItemId: string;
  // Denormalized for quick display — keep in sync with master item
  toyNumber: string;
  collectorNumber: string;
  modelName: string;
  seriesName: string;
  seriesNumber: string;
  // User tracking
  status: ChecklistItemStatus;
  privateOwnershipStatus?: "owned" | "not_owned";
  publicIntentStatus?: ChecklistPublicIntentStatus;
  owned: boolean;
  quantityOwned: number;
  duplicateCount: number;
  duplicateStatus: DuplicateItemStatus;
  isFavorite: boolean;
  isWanted: boolean;
  isForSale: boolean;
  isForTrade: boolean;
  userNotes: string;
  linkedInventoryCarId: string | null;
  publicSearchEnabled?: boolean;
  updatedAt: unknown;
}

export type ChecklistPublicIntentStatus =
  | "none"
  | "actively_looking"
  | "looking_to_buy"
  | "looking_to_trade_for"
  | "looking_to_sell"
  | "available_for_trade"
  | "available_for_sale"
  | "want_duplicate"
  | "have_duplicate"
  | "sold"
  | "traded"
  | "not_interested";

export interface UserTrackedList {
  id: string;
  userId: string;
  listId: string;
  brandId: string;
  brandName: string;
  listTitle: string;
  year: number;
  category: string;
  listType: string;
  itemCount: number;
  pinned: boolean;
  activatedAt: unknown;
  updatedAt: unknown;
}

export type MarketplaceIntentType =
  | "looking_to_buy"
  | "looking_to_trade_for"
  | "available_for_sale"
  | "available_for_trade";

export interface MarketplaceIntent {
  id: string;
  intentId: string;
  userId: string;
  memberDisplayName: string;
  brandId: string;
  year: number;
  listId: string;
  listTitle: string;
  itemId: string;
  modelName: string;
  toyNumber: string;
  collectionNumber: string;
  seriesName: string;
  intentType: MarketplaceIntentType;
  quantity: number;
  condition: string | null;
  askingPrice: number | null;
  tradeNotesPublic: string;
  locationPublicText: string | null;
  isActive: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

// ─── Access / Plan ───────────────────────────────────────────────────────────

export interface PlanLimits {
  maxCars: number;
  maxPhotosPerCar: number;
  maxShowcaseCars: number;
  maxCustomChecklists: number;
  maxTrackedLists: number;
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
