// Matches backend Contact Sequelize model fields
export interface Contact {
  id: number;
  tenant_id: number;
  name: string;       // backend uses 'name', not 'fullName'
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactCreateDto {
  name: string;
  email: string;
  phone: string;
}
