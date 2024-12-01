import { FastifyInstance, FastifyReply, FastifyRequest, RegisterOptions } from 'fastify';

import { Redis } from 'ioredis';

import { redis } from '../../main';
import ANIME from '../../scraping';
import cache from '../../utils/cache';

const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  const animeflv = new ANIME.AnimeFLV();
  const redisCacheTime = 60 * 60;
  const redisPrefix = 'animeflv:';

  fastify.get('/', (_, rp) => {
    rp.status(200).send({
      intro:
        'Bienvenido al proveedor de MonosChinos: explora el sitio web oficial @ https://www3.animeflv.net/',
      routes: ['/recent-episodes', '/top-airing'],
    });
  });

  // Episodes
  fastify.get(
    '/recent-episodes',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const page = (request.query as { page: number }).page || 1;

        const res = redis
          ? await cache.fetch(
              redis as Redis,
              `${redisPrefix}recent-episodes;${page}`,
              async () => await animeflv.recentEpisodes(page),
              redisCacheTime,
            )
          : await animeflv.recentEpisodes(page);

        reply.status(200).send(res);
      } catch (error) {
        reply
          .status(500)
          .send({ message: 'Something went wrong. Contact developers for help.' });
      }
    },
  );

  // Top Airing
  fastify.get('/top-airing', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const page = (request.query as { page: number }).page || 1;

      const res = redis
        ? await cache.fetch(
            redis as Redis,
            `${redisPrefix}top-airing;${page}`,
            async () => await animeflv.topAiring(page),
            redisCacheTime,
          )
        : await animeflv.topAiring(page);

      reply.status(200).send(res);
    } catch (error) {
      reply
        .status(500)
        .send({ message: 'Something went wrong. Contact developers for help.' });
    }
  });

  // info-anime
  fastify.get('/info/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const id = (request.params as { id: string }).id;
    try {
      const res = redis
        ? await cache.fetch(
            redis as Redis,
            `${redisPrefix}info-anime;${id}`,
            async () => await animeflv.infoAnime(id),
            redisCacheTime,
          )
        : await animeflv.infoAnime(id);

      reply.status(200).send(res);
    } catch (error) {
      reply
        .status(500)
        .send({ message: 'Something went wrong. Contact developers for help.' });
    }
  });
};

export default routes;
