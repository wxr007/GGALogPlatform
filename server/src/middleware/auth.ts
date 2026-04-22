import { FastifyRequest, FastifyReply } from 'fastify';

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({
      success: false,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: '无效的认证令牌'
      }
    });
  }
};
