import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../config/database';

export const getUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = request.query as any;
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { username: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          isAdmin: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              datasets: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return reply.send({
      success: true,
      data: {
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          isAdmin: u.isAdmin,
          isActive: u.isActive,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
          datasetCount: u._count.datasets
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    throw error;
  }
};

export const setAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const { isAdmin } = request.body as { isAdmin: boolean };

    const currentUserId = (request.user as any).userId;
    if (id === currentUserId) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'CANNOT_MODIFY_SELF',
          message: '不能修改自己的管理员状态'
        }
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      });
    }

    await prisma.user.update({
      where: { id },
      data: { isAdmin }
    });

    return reply.send({
      success: true,
      message: isAdmin ? '已设置为管理员' : '已取消管理员权限'
    });
  } catch (error) {
    throw error;
  }
};

export const getUserDatasets = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const query = request.query as any;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true }
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

    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = { userId: id };

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const sortField = query.sort === 'date' ? 'date' : 'createdAt';
    const sortOrder = query.order === 'asc' ? 'asc' : 'desc';

    const [datasets, total] = await Promise.all([
      prisma.dataset.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          date: true,
          recordCount: true,
          viewCount: true,
          downloadCount: true,
          createdAt: true
        }
      }),
      prisma.dataset.count({ where })
    ]);

    return reply.send({
      success: true,
      data: {
        user,
        datasets: datasets.map(d => ({
          id: d.id,
          fileName: d.fileName,
          fileSize: d.fileSize,
          date: d.date,
          recordCount: d.recordCount,
          uploadTime: d.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    throw error;
  }
};
