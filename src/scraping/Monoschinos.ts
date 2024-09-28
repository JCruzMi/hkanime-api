import axios from 'axios';
import * as cheerio from 'cheerio';
import { RecentsPaginator, RecentsResult } from './types/recents.type';
import { RecentsNative } from './types/recents-native.type';
import { title } from 'process';
import Casing from '../utils/casing';
import { TopAiringNative } from './types/top-airing-native.type';
import { TopAiringPaginator, TopAiringResult } from './types/top-airing.type';

export class Monoschinos {
  private baseUrl = 'https://monoschinos2.com/';

  recentEpisodes = async (page: number): Promise<RecentsPaginator> => {
    const { data } = await axios.get(this.baseUrl);
    const $ = cheerio.load(data);

    const data2: RecentsNative[] = [];
    $('div.play').each((_index, element) => {
      const liElement = $(element).closest('li');

      const imgSrc = liElement.find('img').attr('src') || '';
      const animeUrl = liElement.find('a').attr('href') || '';
      const title = liElement.find('h2').text().trim();
      const episode = liElement.find('span.episode').text().trim();

      data2.push({
        title,
        imgSrc,
        animeUrl,
        episode,
      });
    });

    return this.sanitizeRecentEpisodes(data2, page);
  };

  topAiring = async (page: number): Promise<TopAiringPaginator> => {
    const { data } = await axios.get(this.baseUrl);
    const $ = cheerio.load(data);

    const data2: TopAiringNative[] = [];

    $('.ficha_efecto').each((index, element) => {
      const anime = {
        url: $(element).find('a').attr('href') || '',
        image: $(element).find('img').attr('src') || '',
        title: $(element).find('h3').text().trim(),
        genre: $(element).find('.badge').text().trim(),
      };
      data2.push(anime);
    });

    return this.sanitizeTopAiring(data2, page);
  };

  private sanitizeRecentEpisodes(
    data: RecentsNative[],
    page: number = 1,
  ): RecentsPaginator {
    const data2: RecentsResult[] = data.map((item) => {
      const chopAnimeUrl = item.animeUrl.split('/');
      return {
        id: Casing.kebabCase(item.title),
        episodeId: chopAnimeUrl[chopAnimeUrl.length - 1],
        episodeNumber: Number(item.episode) || 0,
        title: item.title,
        image: item.imgSrc,
        url: item.animeUrl,
      };
    });

    return this.paginator(data2, page) as RecentsPaginator;
  }

  private sanitizeTopAiring(
    data: TopAiringNative[],
    page: number = 1,
  ): TopAiringPaginator {
    const data2: TopAiringResult[] = data.map((item) => {
      return {
        id: Casing.kebabCase(item.title),
        title: item.title,
        image: item.image,
        url: item.url,
        genre: item.genre,
      };
    });

    return this.paginator(data2, page) as TopAiringPaginator;
  }

  private paginator(results: any[], page: number): Object {
    const pageSize = 20;

    const data = results.splice((page - 1) * pageSize, pageSize);
    return {
      currentPage: page.toString(),
      hasNextPage: results.length > page * pageSize,
      results: data,
    };
  }
}
