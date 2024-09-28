export interface Recents {
  currentPage: string;
  hasNextPage: boolean;
  results: Result[];
}

export interface Result {
  id: string;
  episodeId: string;
  episodeNumber: number;
  title: string;
  image: string;
  url: string;
}


