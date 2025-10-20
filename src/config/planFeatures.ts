/**
 * Plan Feature Configuration
 * Defines what features are available for each subscription plan
 */

export interface PlanFeatures {
  name: string;
  searchFilters: {
    basicFilters: boolean; // Single category, status
    roiRange: boolean; // Min/max ROI filter
    amountRange: boolean; // Min/max funding goal filter
    multipleCategories: boolean; // Select multiple categories
    advancedSort: boolean; // Sort by multiple fields
    durationFilter: boolean; // Filter by project duration
  };
  limits: {
    projectsPerMonth: number;
    simulationsPerMonth: number;
    savedSearches: number;
  };
}

export const PLAN_FEATURES: Record<string, PlanFeatures> = {
  free: {
    name: 'Free',
    searchFilters: {
      basicFilters: true,
      roiRange: false,
      amountRange: false,
      multipleCategories: false,
      advancedSort: false,
      durationFilter: false,
    },
    limits: {
      projectsPerMonth: 10,
      simulationsPerMonth: 5,
      savedSearches: 0,
    },
  },
  basic: {
    name: 'Basic',
    searchFilters: {
      basicFilters: true,
      roiRange: true,
      amountRange: false,
      multipleCategories: false,
      advancedSort: false,
      durationFilter: false,
    },
    limits: {
      projectsPerMonth: 50,
      simulationsPerMonth: 20,
      savedSearches: 3,
    },
  },
  plus: {
    name: 'Plus',
    searchFilters: {
      basicFilters: true,
      roiRange: true,
      amountRange: true,
      multipleCategories: true,
      advancedSort: false,
      durationFilter: true,
    },
    limits: {
      projectsPerMonth: 200,
      simulationsPerMonth: 100,
      savedSearches: 10,
    },
  },
  premium: {
    name: 'Premium',
    searchFilters: {
      basicFilters: true,
      roiRange: true,
      amountRange: true,
      multipleCategories: true,
      advancedSort: true,
      durationFilter: true,
    },
    limits: {
      projectsPerMonth: -1, // Unlimited
      simulationsPerMonth: -1, // Unlimited
      savedSearches: -1, // Unlimited
    },
  },
};

/**
 * Check if a user's plan has access to a specific feature
 */
export function hasFeatureAccess(
  planKey: string,
  feature: keyof PlanFeatures['searchFilters']
): boolean {
  const plan = PLAN_FEATURES[planKey] || PLAN_FEATURES.free;
  return plan.searchFilters[feature];
}

/**
 * Get all available features for a plan
 */
export function getPlanFeatures(planKey: string): PlanFeatures {
  return PLAN_FEATURES[planKey] || PLAN_FEATURES.free;
}

/**
 * Get the minimum required plan for a feature
 */
export function getMinimumPlanForFeature(
  feature: keyof PlanFeatures['searchFilters']
): string {
  const plans = ['free', 'basic', 'plus', 'premium'];
  for (const planKey of plans) {
    if (PLAN_FEATURES[planKey].searchFilters[feature]) {
      return planKey;
    }
  }
  return 'premium';
}
