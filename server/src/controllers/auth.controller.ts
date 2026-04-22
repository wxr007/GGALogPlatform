import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

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

    const accessToken = request.server.generateAccessToken({ id: user.id, username: user.username });
    const refreshToken = request.server.generateRefreshToken({ id: user.id, username: user.username });

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenHash,
        expiresAt
      }
    });

    return reply.code(201).send({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        accessToken,
        refreshToken,
        expiresIn: 7200
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

    const accessToken = request.server.generateAccessToken({ id: user.id, username: user.username });
    const refreshToken = request.server.generateRefreshToken({ id: user.id, username: user.username });

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenHash,
        expiresAt
      }
    });

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        accessToken,
        refreshToken,
        expiresIn: 7200
      }
    });
  } catch (error) {
    throw error;
  }
};

export const refreshToken = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_REQUIRED',
          message: '请提供刷新令牌'
        }
      });
    }

    let payload: any;
    try {
      payload = request.server.jwt.verify(refreshToken);
    } catch {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_INVALID',
          message: '刷新令牌无效'
        }
      });
    }

    if (payload.type !== 'refresh') {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: '令牌类型错误'
        }
      });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: tokenHash,
        revoked: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!storedToken) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_EXPIRED',
          message: '刷新令牌已过期或已失效'
        }
      });
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true }
    });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || !user.isActive) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在或已被禁用'
        }
      });
    }

    const newAccessToken = request.server.generateAccessToken({ id: user.id, username: user.username });
    const newRefreshToken = request.server.generateRefreshToken({ id: user.id, username: user.username });

    const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newTokenHash,
        expiresAt: newExpiresAt
      }
    });

    return reply.send({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 7200
      }
    });
  } catch (error) {
    throw error;
  }
};

export const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { refreshToken } = request.body as { refreshToken: string };

    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await prisma.refreshToken.updateMany({
        where: {
          token: tokenHash,
          revoked: false
        },
        data: { revoked: true }
      });
    }

    return reply.send({
      success: true,
      message: '退出登录成功'
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
