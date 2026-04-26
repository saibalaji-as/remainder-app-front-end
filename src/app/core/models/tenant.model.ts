// Matches backend Tenant Sequelize model fields
export interface Tenant {
  id: number;
  name: string;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}
