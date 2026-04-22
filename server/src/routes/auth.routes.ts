import { FastifyInstance } from 'fastify';
import { register, login, refreshToken, logout, getProfile } from '../controllers/auth.controller';

export const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 20 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          phone: { type: 'string' }
        }
      }
    },
    handler: register
  });

  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      }
    },
    handler: login
  });

  fastify.post('/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      }
    },
    handler: refreshToken
  });

  fastify.post('/logout', {
    schema: {
      body: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string' }
        }
      }
    },
    handler: logout
  });

  fastify.get('/profile', {
    preHandler: [fastify.authenticate],
    handler: getProfile
  });
};
