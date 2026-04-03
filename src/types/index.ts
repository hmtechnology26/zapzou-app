export interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  image: string;
  images?: string[];
  rating?: number;
  reviews_count?: number;
  price?: string;
  provider: string;
  provider_id?: string;
  frequency?: string;
  isActive?: boolean;
  WhatsApp?: string;
  instagram?: string;
  status: 'active' | 'pending' | 'rejected';
  environmentId?: string;
  environmentSlug?: string;
  environmentName?: string;
  environmentType?: string;
  environmentLatitude?: number;
  environmentLongitude?: number;
  environments?: { id: string; slug: string }[];
  reviewList?: Review[];
  verified?: boolean;
  location?: string;
  tags?: string[];
  menu?: MenuItem[];
  views?: number;
  availabilityStatus?: 'active' | 'pending';
  availabilityReason?: string;
}

export interface Review {
  id: string;
  service_id?: string;
  user_id?: string;
  userName?: string;
  user_avatar?: string;
  stars: number;
  comment?: string;
  created_at?: string;
  isAnonymous?: boolean;
}

export interface Environment {
  id: string;
  slug: string;
  name: string;
  type: string;
  members: number;
  image: string;
  isSelected?: boolean;
  status?: string;
  latitude?: number;
  longitude?: number;
  requiresModeratorApproval?: boolean;
  requiresRadiusValidation?: boolean;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  unit?: string;
  avatar?: string;
  initials?: string;
  isPending?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
}
