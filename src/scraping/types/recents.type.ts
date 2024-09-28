export interface RecentsPaginator {
  currentPage: string;
  hasNextPage: boolean;
  results: RecentsResult[];
}

export interface RecentsResult {
  id: string;
  episodeId: string;
  episodeNumber: number;
  title: string;
  image: string;
  url: string;
}


