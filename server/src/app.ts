import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { config } from './config/app';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/error';
import { authRoutes } from './routes/auth.routes';
import { dataRoutes } from './routes/data.routes';

declare module 'fastify' {
  interface FastifyInstance {
    generateAccessToken: (payload: { id: string; username: string }) => string;
    generateRefreshToken: (payload: { id: string; username: string }) => string;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    jwtVerify: () => Promise<string>;
  }
}

export const app = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'debug' : 'info'
  }
});

app.register(cors, {
  origin: config.cors.allowedOrigins,
  credentials: true
});

app.register(jwt, {
  secret: config.jwt.secret,
  sign: {
    expiresIn: config.jwt.expiresIn
  }
});

app.register(multipart, {
  limits: {
    fileSize: config.upload.maxFileSize
  }
});

app.register(swagger, {
  openapi: {
    info: {
      title: 'GGA数据管理平台API',
      description: 'GGA数据管理服务平台的RESTful API文档',
      version: '1.0.0'
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: '开发服务器'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
});

app.register(swaggerUI, {
  routePrefix: '/api-docs',
  uiConfig: {
    docExpansion: 'list'
  }
});

app.decorate('generateAccessToken', function(payload: { id: string; username: string }) {
  return this.jwt.sign({
    userId: payload.id,
    username: payload.username,
    type: 'access'
  }, {
    expiresIn: config.jwt.accessExpiresIn
  });
});

app.decorate('generateRefreshToken', function(payload: { id: string; username: string }) {
  return this.jwt.sign({
    userId: payload.id,
    username: payload.username,
    type: 'refresh'
  }, {
    expiresIn: config.jwt.refreshExpiresIn
  });
});

app.decorate('authenticate', async (request: any, reply: any) => {
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
});

app.register(authRoutes, { prefix: '/api/auth' });
app.register(dataRoutes, { prefix: '/api/data' });

app.setErrorHandler(errorHandler);

app.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

export const initialize = async () => {
  await connectDatabase();
  await app.ready();
  return app;
};
