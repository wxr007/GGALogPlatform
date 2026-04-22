import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';

export const register = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { username, email, password, phone } = request.body as {
      username: string;
      email: string;
      password: string;
      phone?: string;
    };

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return reply.code(409).send({
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: '用户名或邮箱已存在'
        }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        phone
      }
    });

    const token = request.server.generateToken({ id: user.id, username: user.username });

    return reply.code(201).send({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    throw error;
  }
};

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: '邮箱或密码错误'
        }
      });
    }

    if (!user.isActive) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: '账户已被禁用'
        }
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = request.server.generateToken({ id: user.id, username: user.username });

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token,
        expiresIn: 86400
      }
    });
  } catch (error) {
    throw error;
  }
};

export const getProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        isActive: true
      }
    });

    if (!user) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      });
    }

    return reply.send({
      success: true,
      data: user
    });
  } catch (error) {
    throw error;
  }
};
