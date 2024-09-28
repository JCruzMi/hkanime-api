import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';
import cache from '../../utils/cache';
import { redis } from '../../main';
import { Redis } from 'ioredis';
import ANIME from '../../scraping';

const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  const monoschinos = new ANIME.Monoschinos();
  const redisCacheTime = 60 * 60;
  const redisPrefix = 'monoschinos:';

  fastify.get('/', (_, rp) => {
    rp.status(200).send({
      intro:
        'Bienvenido al proveedor de MonosChinos: explora el sitio web oficial @ https://monoschinos2.com/',
      routes: [
        '/:query',
        '/info/:id',
        '/watch/:episodeId',
        '/genre/:genre',
        '/recent-episodes',
        '/anime-list',
      ],
    });
  });

  fastify.get(
    '/recent-episodes',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const page = (request.query as { page: number }).page || 1;

        const res = redis
          ? await cache.fetch(
              redis as Redis,
              `${redisPrefix}recent-episodes;${page}`,
              async () => await monoschinos.recentEpisodes(page),
              redisCacheTime,
            )
          : await monoschinos.recentEpisodes(page);

        reply.status(200).send(res);
      } catch (error) {
        reply
          .status(500)
          .send({ message: 'Something went wrong. Contact developers for help.' });
      }
    },
  );

  /* fastify.get('/:query', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = (request.params as { query: string }).query.replace(/ /g, '+');
    const page = (request.query as { page: number }).page || 1;

    const res = redis
      ? await cache.fetch(
          redis as Redis,
          `${redisPrefix}search;${page};${query}`,
          async () => {
            const $ = await fetchPage(`${baseUrl}buscar?q=${query}&page=${page}`);
            const results: Array<any> = [];

            $('.anime__item').each((_: any, element: any) => {
              const title = $(element).find('.anime__item__text h5').text();
              const image = $(element).find('.anime__item__pic img').attr('src');
              const link = $(element).find('a').attr('href');
              results.push({ title, image, link });
            });

            return results;
          },
          redisCacheTime,
        )
      :  await fetchPage(`${baseUrl}buscar?q=${query}&page=${page}`);

    reply.status(200).send(res);
  });
  */

  /* fastify.get('/info/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const id = (request.params as { id: string }).id;

    const res = redis
      ? await cache.fetch(
          redis as Redis,
          `${redisPrefix}info;${id}`,
          async () => {
            const $ = await fetchPage(`${baseUrl}anime/${id}`);
            const title = $('h1').text();
            const description = $('.description').text();
            const episodes: any = [];
            $('.episodes').each((_, el) => {
              const ep = $(el).find('a').attr('href');
              episodes.push(ep);
            });
            return { title, description, episodes };
          },
          redisCacheTime,
        )
      : await fetchPage(`${baseUrl}anime/${id}`);

    reply.status(200).send(res);
  }); */

  /* fastify.get('/genre/:genre', async (request: FastifyRequest, reply: FastifyReply) => {
    const genre = (request.params as { genre: string }).genre;
    const page = (request.query as { page: number }).page || 1;

    const res = redis
      ? await cache.fetch(
          redis as Redis,
          `${redisPrefix}genre;${genre};${page}`,
          async () => {
            const $ = await fetchPage(`${baseUrl}genero/${genre}?page=${page}`);
            const results: Array<any> = [];

            $('.anime__item').each((_, element) => {
              const title = $(element).find('.anime__item__text h5').text();
              const image = $(element).find('.anime__item__pic img').attr('src');
              const link = $(element).find('a').attr('href');
              results.push({ title, image, link });
            });

            return results;
          },
          redisCacheTime,
        )
      : await fetchPage(`${baseUrl}genero/${genre}?page=${page}`);

    reply.status(200).send(res);
  }); */
};

export default routes;
