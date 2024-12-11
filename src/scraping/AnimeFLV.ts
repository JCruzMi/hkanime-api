import axios from 'axios';

import * as cheerio from 'cheerio';

import puppeteer, { Browser } from 'puppeteer';

import Casing from '../utils/casing';

import {
  Episodes,
  InfoAnimes,
  RecentsNative,
  RecentsPaginator,
  RecentsResult,
  TopAiringNative,
  TopAiringPaginator,
  TopAiringResult,
} from './types/index.types';

export class AnimeFLV {
  private baseUrl = 'https://www3.animeflv.net/';

  // info anime
  public infoAnime = async (id: string): Promise<InfoAnimes> => {
    let browser: Browser | null = null;

    try {
      browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const pageInstance = await browser.newPage();

      await pageInstance.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
          'AppleWebKit/537.36 (KHTML, like Gecko) ' +
          'Chrome/89.0.4389.82 Safari/537.36',
      );

      await pageInstance.goto(`${this.baseUrl}anime/${id}`, {
        waitUntil: 'networkidle2',
      });

      const data = await pageInstance.evaluate(() => {
        const subOrDub = 'Sub';
        const title = document.querySelector('h1')?.textContent?.trim();
        console.log(title);
        const image = document.querySelector('div.AnimeCover img')?.getAttribute('src');
        const type = document.querySelector('span .Type')?.textContent?.trim();
        const releaseDate = document
          .querySelector('dl dd:nth-of-type(2)')
          ?.textContent?.trim();
        const otherName = document
          .querySelector('dl dd:nth-of-type(4)')
          ?.textContent?.trim();
        const status = Array.from(document.querySelectorAll('div.d-flex.gap-2.lh-sm'))
          .find(
            (div) =>
              div.querySelector('div.text-muted')?.textContent?.trim() === 'Estado',
          )
          ?.querySelector('div:nth-of-type(2)')
          ?.textContent?.trim();
        const season = Array.from(document.querySelectorAll('div.d-flex.gap-2.lh-sm'))
          .find(
            (div) =>
              div.querySelector('div.text-muted')?.textContent?.trim() === 'Temporada',
          )
          ?.querySelector('div:nth-of-type(2)')
          ?.textContent?.trim()
          .replace(/^Temporada\s*/, '');
        const totalEpisodes = document.querySelector('ul.ListCaps li');
        const description = document
          .querySelector('div.Description > p')
          ?.textContent?.trim();
        const genres = Array.from(document.querySelectorAll('nav.Nvgnrs a')).map((a) =>
          a.textContent?.trim(),
        );

        const episodes: Episodes[] = [];

        return {
          // id: title ? Casing.kebabCase(title) : '0', // TODO fix, al descomnetar da error en la respuesta
          // title,
          // image,
          // description,
          // status,
          // type: `${season} ${type}`,
          // totalEpisodes: totalEpisodes ? Number(totalEpisodes) : 0,
          // episodes,
          // releaseDate,
          // otherName,
          // genres,
          // subOrDub,
        };
      });
      return data as unknown as InfoAnimes;
    } catch (error) {
      console.error('Error al obtener la información:', error);
      throw error;
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error al cerrar el navegador:', closeError);
        }
      }
    }
  };
  // recent episodes
  public recentEpisodes = async (page: number): Promise<RecentsPaginator> => {
    try {
      const { data } = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(data);
      const results: RecentsNative[] = [];

      $('.ListEpisodios li').each((_, element) => {
        const liElement = $(element).closest('li');
        const img = liElement.find('img');
        const animeLink = liElement.find('a');
        const titleElement = liElement.find('strong.Title');
        const episodeElement = liElement.find('span.episode');

        results.push({
          title: titleElement.text().trim(),
          imgSrc: img.attr('src') || '',
          animeUrl: animeLink.attr('href') || '',
          episode: episodeElement.text().trim(),
        });
      });

      return this.sanitizeRecentEpisodes(results, page);
    } catch (error) {
      console.error('Error al obtener episodios recientes:', error);
      throw error;
    }
  };
  // top airing
  public topAiring = async (page: number): Promise<TopAiringPaginator> => {
    const { data } = await axios.get(this.baseUrl);
    const $ = cheerio.load(data);

    const data2: TopAiringNative[] = [];

    $('.ListAnimes li').each((index, element) => {
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

  private paginator(results: any[], page: number): Object {
    const pageSize = 20;

    const data = results.splice((page - 1) * pageSize, pageSize);
    return {
      currentPage: page.toString(),
      hasNextPage: results.length > page * pageSize,
      results: data,
    };
  }

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
        image: this.baseUrl + item.image,
        url: item.url,
        genre: item.genre,
      };
    });

    return this.paginator(data2, page) as TopAiringPaginator;
  }
}
