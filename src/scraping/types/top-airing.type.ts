export interface TopAiringPaginator {
  currentPage: string;
  hasNextPage: boolean;
  results: TopAiringResult[];
}

export interface TopAiringResult {
  id: string;
  genre: string;
  title: string;
  image: string;
  url: string;
}
