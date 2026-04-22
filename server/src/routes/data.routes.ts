import { FastifyInstance } from 'fastify';
import { uploadData, getDatasets, getDatasetDetail, downloadDataset, getStats } from '../controllers/data.controller';

export const dataRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/upload', {
    preHandler: [fastify.authenticate],
    handler: uploadData
  });

  fastify.get('/datasets', {
    preHandler: [fastify.authenticate],
    handler: getDatasets
  });

  fastify.get('/datasets/:id', {
    preHandler: [fastify.authenticate],
    handler: getDatasetDetail
  });

  fastify.get('/datasets/:id/download', {
    preHandler: [fastify.authenticate],
    handler: downloadDataset
  });

  fastify.get('/stats', {
    preHandler: [fastify.authenticate],
    handler: getStats
  });
};
