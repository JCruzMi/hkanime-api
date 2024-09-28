import axios from 'axios';
import * as cheerio from 'cheerio';
import { Recents, Result } from './types/recents.type';
import { RecentsNative } from './types/recents-native.type';
import { title } from 'process';
import Casing from '../utils/casing';

export class Monoschinos {
  private baseUrl = 'https://monoschinos2.com/';

  recentEpisodes = async (page: number): Promise<Recents> => {
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

  private sanitizeRecentEpisodes(data: RecentsNative[], page: number = 1): Recents {
    const data2: Result[] = data.map((item) => {
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

    return this.paginator(data2, page);
  }

  private paginator(results: Result[], page: number): Recents {
    const data = results.splice((page - 1) * 20, 20);
    return {
      currentPage: page.toString(),
      hasNextPage: results.length > page * 20,
      results: data,
    };
  }
}
