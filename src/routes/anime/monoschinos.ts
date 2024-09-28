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
      routes: ['/recent-episodes', '/top-airing'],
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

  fastify.get('/top-airing', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const page = (request.query as { page: number }).page || 1;

      const res = redis
        ? await cache.fetch(
            redis as Redis,
            `${redisPrefix}top-airing;${page}`,
            async () => await monoschinos.topAiring(page),
            redisCacheTime,
          )
        : await monoschinos.topAiring(page);

      reply.status(200).send(res);
    } catch (error) {
      reply
        .status(500)
        .send({ message: 'Something went wrong. Contact developers for help.' });
    }
  });
};

export default routes;
