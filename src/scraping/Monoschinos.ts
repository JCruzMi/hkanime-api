import axios from 'axios';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { RecentsPaginator, RecentsResult } from './types/recents.type';
import { RecentsNative } from './types/recents-native.type';
import Casing from '../utils/casing';
import { TopAiringNative } from './types/top-airing-native.type';
import { TopAiringPaginator, TopAiringResult } from './types/top-airing.type';

export class Monoschinos {
  private baseUrl = 'https://monoschinos2.com/';
  recentEpisodes = async (page: number): Promise<RecentsPaginator> => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const pageInstance = await browser.newPage();

      await pageInstance.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/89.0.4389.82 Safari/537.36',
      );

      await pageInstance.goto(this.baseUrl, { waitUntil: 'networkidle2' });

      await pageInstance.waitForSelector('div.play');

      const data2: RecentsNative[] = await pageInstance.evaluate(() => {
        const results: RecentsNative[] = [];

        const playElements = document.querySelectorAll('div.play');

        playElements.forEach((element) => {
          const liElement = element.closest('li');

          if (liElement) {
            const img = liElement.querySelector('img');
            const animeLink = liElement.querySelector('a');
            const titleElement = liElement.querySelector('h2');
            const episodeElement = liElement.querySelector('span.episode');

            const imgSrc = img?.getAttribute('src') || '';
            const animeUrl = animeLink?.getAttribute('href') || '';
            const title = titleElement?.textContent?.trim() || '';
            const episode = episodeElement?.textContent?.trim() || '';

            results.push({
              title,
              imgSrc,
              animeUrl,
              episode,
            });
          }
        });

        return results;
      });

      return this.sanitizeRecentEpisodes(data2, page);
    } catch (error) {
      console.error('Error al obtener episodios recientes:', error);
      throw error;
    } finally {
      await browser.close();
    }
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
