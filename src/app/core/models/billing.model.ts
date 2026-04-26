// Matches backend Subscription Sequelize model fields
export interface Subscription {
  id: number;
  tenant_id: number;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscribeDto {
  priceId: string;
  paymentMethodId: string;
}

// Kept for UI display purposes (not a backend model)
export interface BillingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  features: string[];
}
