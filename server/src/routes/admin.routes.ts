import { FastifyInstance } from 'fastify';
import { getUsers, setAdmin, getUserDatasets, getAdminDatasetDetail, downloadAdminDataset, updateDatasetFileType } from '../controllers/admin.controller';

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

  fastify.get('/datasets/:id', {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
    handler: getAdminDatasetDetail
  });

  fastify.get('/datasets/:id/download', {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
    handler: downloadAdminDataset
  });

  fastify.put('/datasets/:id/fileType', {
    preHandler: [fastify.authenticate, fastify.requireAdmin],
    schema: {
      body: {
        type: 'object',
        required: ['fileType'],
        properties: {
          fileType: { type: 'string' }
        }
      }
    },
    handler: updateDatasetFileType
  });
};
