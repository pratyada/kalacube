export enum AuthType {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  KALACUBE = 'kalacube',
}

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  CURATOR = 'curator',
  ARTIST = 'artist',
  ARTSPACE = 'art-space',
  USER = 'user',
}

export enum ArtDimension {
  HANDICRAFT = 'handicraft',
  VISUAL_ART = 'visual_art',
  PERFORMING_ARTS = 'performing_arts',
}

export enum SpaceType {
  GALLERY = 'gallery',
  MUSEUM = 'museum',
  STUDIO = 'studio',
  CO_WORKING = 'co-working',
  OUTDOOR = 'outdoor',
  VIRTUAL = 'virtual',
  OTHER = 'other',
}

export const PRIVATE_USER_FIELDS = ['password', 'phone', 'countryCode'];
