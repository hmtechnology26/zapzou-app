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
  environments?: { id: string; slug: string }[];
  reviewList?: Review[];
  verified?: boolean;
  location?: string;
  tags?: string[];
  menu?: MenuItem[];
  latitude?: number;
  longitude?: number;
  views?: number;
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
}

export interface Environment {
  id: string;
  slug: string;
  name: string;
  type: 'residential' | 'church' | 'club' | 'association';
  members: number;
  image: string;
  isSelected?: boolean;
  status?: string;
  latitude?: number;
  longitude?: number;
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
