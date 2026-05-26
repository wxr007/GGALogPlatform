import { FastifyInstance } from 'fastify';
import { getUsers, setAdmin, getUserDatasets } from '../controllers/admin.controller';

export const adminRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/users', {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
    handler: getUsers
  });

  fastify.put('/users/:id/admin', {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
    handler: setAdmin
  });

  fastify.get('/users/:id/datasets', {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
    handler: getUserDatasets
  });
};
