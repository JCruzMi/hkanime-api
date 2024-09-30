export interface Episodes {
  id: string;
  image?: string;
  number: number;
  url: string;
}

export interface InfoAnimes {
  description: string;
  episodes: Episodes[];
  genres: string[];
  id: string;
  image: string;
  otherName: string;
  releaseDate: string;
  status: string;
  subOrDub: string;
  title: string;
  totalEpisodes: number;
  type: string;
}
