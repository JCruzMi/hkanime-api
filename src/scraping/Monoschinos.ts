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

export class Monoschinos {
  private baseUrl = 'https://monoschinos2.net/';

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
        const image = document.querySelector('img.bg-secondary')?.getAttribute('src');
        const type = document.querySelector('dl dd:nth-of-type(1)')?.textContent?.trim();
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
        const totalEpisodes = document.querySelector('div.ep_count')?.textContent?.trim();
        const description = document.querySelector('div.mb-3 > p')?.textContent?.trim();
        const genres = Array.from(document.querySelectorAll('.lh-lg a span.badge')).map(
          (span) => span.textContent?.trim(),
        );

        const episodes: Episodes[] = [];

        //TODO: fix, al descomnetar da error en la respuesta
        // const listEpisodes = document.querySelectorAll('.eplist li');

        // listEpisodes.forEach((item) => {
        //   const a = item.querySelector('a.ko') as HTMLAnchorElement | null;

        //   if (a) {
        //     const h2 = a.querySelector('h2');
        //     const id = h2?.textContent?.replace(/^Episodio\s*/, '') || '0';

        //     const url = a.href;
        //     const img = a.querySelector('img') as HTMLImageElement | null;

        //     const image = img ? img.src : '';

        //     episodes.push({
        //       id: Casing.kebabCase(`${title}-${id}`),
        //       number: Number(id),
        //       url,
        //       image,
        //     });
        //   } else {
        //     console.error('El elemento <a> no se encontró.');
        //   }
        // });

        return {
          // id: title ? Casing.kebabCase(title) : '0', // TODO fix, al descomnetar da error en la respuesta
          title,
          image,
          description,
          status,
          type: `${season} ${type}`,
          totalEpisodes: totalEpisodes ? Number(totalEpisodes) : 0,
          episodes,
          releaseDate,
          otherName,
          genres,
          subOrDub,
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
      // Primer intento con axios
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

      $('div.play').each((_, element) => {
        const liElement = $(element).closest('li');
        const img = liElement.find('img');
        const animeLink = liElement.find('a');
        const titleElement = liElement.find('h2');
        const episodeElement = liElement.find('span.episode');

        // Intentar obtener la URL real de la imagen desde data-src o data-lazy
        const imgSrc =
          img.attr('data-src') || img.attr('data-lazy') || img.attr('src') || '';

        results.push({
          title: titleElement.text().trim(),
          imgSrc,
          animeUrl: animeLink.attr('href') || '',
          episode: episodeElement.text().trim(),
        });
      });

      // Si no hay imágenes reales (solo placeholders), usar Puppeteer como fallback
      if (
        results.length > 0 &&
        results.every((item) => !item.imgSrc || item.imgSrc.includes('placeholder'))
      ) {
        return await this.recentEpisodesWithPuppeteer(page);
      }

      return this.sanitizeRecentEpisodes(results, page);
    } catch (error) {
      console.error('Error con axios, intentando con Puppeteer:', error);
      return await this.recentEpisodesWithPuppeteer(page);
    }
  };

  private recentEpisodesWithPuppeteer = async (
    page: number,
  ): Promise<RecentsPaginator> => {
    let browser: Browser | null = null;

    try {
      browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--window-size=1920,1080',
        ],
        timeout: 30000,
      });

      const pageInstance = await browser.newPage();
      await pageInstance.setDefaultNavigationTimeout(30000);
      await pageInstance.setDefaultTimeout(30000);

      await pageInstance.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      );

      await pageInstance.goto(this.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Esperar a que las imágenes se carguen
      await pageInstance.waitForSelector('div.play img[src]:not([src*="placeholder"])', {
        timeout: 10000,
      });

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

            results.push({
              title: titleElement?.textContent?.trim() || '',
              imgSrc: img?.getAttribute('src') || '',
              animeUrl: animeLink?.getAttribute('href') || '',
              episode: episodeElement?.textContent?.trim() || '',
            });
          }
        });

        return results;
      });

      return this.sanitizeRecentEpisodes(data2, page);
    } catch (error) {
      console.error('Error al obtener episodios recientes con Puppeteer:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close().catch(console.error);
      }
    }
  };
  // top airing
  public topAiring = async (page: number): Promise<TopAiringPaginator> => {
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
        image: item.image,
        url: item.url,
        genre: item.genre,
      };
    });

    return this.paginator(data2, page) as TopAiringPaginator;
  }
}
