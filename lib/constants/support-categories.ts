export enum SupportCategory {
  SALES = 'Sales support',
  SUBSCRIPTIONS = 'Subscriptions & Plans',
  ENTERPRISE_PLAN = 'Enterprise plan',
  BILLINGS = 'Billings',
  CREDITS = 'Credits',
  AD_GENERATION = 'Ad Generation',
  INTEGRATIONS = 'Integrations',
  TECHNICAL_ISSUES = 'Technical Issues',
  PRODUCT_FEEDBACK = 'Product Feedback',
  OTHER = 'Other',
}

export const SUPPORT_CATEGORIES = Object.values(SupportCategory);

export const SALES_CATEGORIES = [
  SupportCategory.SALES,
  SupportCategory.SUBSCRIPTIONS,
  SupportCategory.ENTERPRISE_PLAN,
];

export function isSalesCategory(category: string): boolean {
  return SALES_CATEGORIES.includes(category as SupportCategory);
}

