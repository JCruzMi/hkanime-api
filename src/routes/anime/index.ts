import { PROVIDERS_LIST } from '@consumet/extensions';

import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';

import nineanime from './9anime';
import anify from './anify';
import animeflv from './animeflv';
import animefox from './animefox';
import animepahe from './animepahe';
import bilibili from './bilibili';
import crunchyroll from './crunchyroll';
import gogoanime from './gogoanime';
import marin from './marin';
import monoschinos from './monoschinos';
import zoro from './zoro';

const routes = async (fastify: FastifyInstance, options: RegisterOptions) => {
  await fastify.register(gogoanime, { prefix: '/gogoanime' });
  await fastify.register(animepahe, { prefix: '/animepahe' });
  await fastify.register(zoro, { prefix: '/zoro' });
  await fastify.register(nineanime, { prefix: '/9anime' });
  await fastify.register(animefox, { prefix: '/animefox' });
  await fastify.register(anify, { prefix: '/anify' });
  await fastify.register(crunchyroll, { prefix: '/crunchyroll' });
  await fastify.register(bilibili, { prefix: '/bilibili' });
  await fastify.register(marin, { prefix: '/marin' });

  fastify.get('/', async (request: any, reply: any) => {
    reply.status(200).send('Welcome to Consumet Anime 🗾');
  });

  fastify.get('/:animeProvider', async (request: FastifyRequest, reply: FastifyReply) => {
    const queries: { animeProvider: string; page: number } = {
      animeProvider: '',
      page: 1,
    };

    queries.animeProvider = decodeURIComponent(
      (request.params as { animeProvider: string; page: number }).animeProvider,
    );

    queries.page = (request.query as { animeProvider: string; page: number }).page;

    if (queries.page! < 1) queries.page = 1;

    const provider = PROVIDERS_LIST.ANIME.find(
      (provider: any) => provider.toString.name === queries.animeProvider,
    );

    try {
      if (provider) {
        reply.redirect(`/anime/${provider.toString.name}`);
      } else {
        reply
          .status(404)
          .send({ message: 'Provider not found, please check the providers list.' });
      }
    } catch (err) {
      reply.status(500).send('Something went wrong. Please try again later.');
    }
  });
};

export default routes;
