export interface User {
  // Set when a verified Cognito user has no Mongo profile yet (needs onboarding).
  isNewUser?: boolean;
  isFeatured?: boolean;
  _id: string;
  authType: string;
  role: 'superadmin' | 'admin' | 'curator' | 'artist' | 'art-space' | 'user';
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dob: string;
  avatar?: { key: string; url: string };
  coverImage?: { key: string; url: string };
  bio?: string;
  location?: { city?: string; state?: string; country?: string };
  website?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    youtube?: string;
  };
  profileCompleteness: number;
  isActive: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dob: string;
  role?: string;
  phone?: string;
  countryCode?: string;
}
