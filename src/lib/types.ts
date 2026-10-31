export interface PlaylistTrack {
  title: string;
  artist: string;
  cover: string;
  src: string;
  lyrics: { time: number; text: string }[];
}

export interface GalleryAlbum {
  slug: string;
  title: string;
  description: string;
  cover: string;
  password?: string;
  images: { src: string; alt: string }[];
}

export interface Moment {
  date: string;
  content: string;
  images?: string[];
}

export interface Friend {
  name: string;
  group?: string;
  url: string;
  avatar: string;
  description: string;
}
