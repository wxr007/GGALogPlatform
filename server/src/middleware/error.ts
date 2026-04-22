import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || '服务器内部错误';

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }

  reply.status(statusCode).send({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: message
    }
  });
};
