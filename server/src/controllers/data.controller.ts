import { FastifyReply, FastifyRequest } from 'fastify';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../config/database';
import { config } from '../config/app';

export const uploadData = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId;
    
    console.log('=== Upload API debug log ===');
    console.log('userId:', userId);

    // 使用 parts() 处理所有部分
    const parts = request.parts();
    
    let filePart: any = null;
    let fileBuffer: Buffer | null = null;
    let dateTimeStr = new Date().toISOString();
    let deviceId: string | undefined;
    let deviceModel: string | undefined;
    
    for await (const part of parts) {
      if (part.file) {
        filePart = part;
        console.log('File name:', part.filename);
        console.log('MIME type:', part.mimetype);
        // 使用 toBuffer() 读取文件内容
        fileBuffer = await part.toBuffer();
        console.log('File size:', fileBuffer.length);
      } else {
        console.log('Form field:', part.fieldname, '=', part.value);
        if (part.fieldname === 'dateTime') {
          dateTimeStr = part.value;
        } else if (part.fieldname === 'deviceId') {
          deviceId = part.value;
        } else if (part.fieldname === 'deviceModel') {
          deviceModel = part.value;
        }
      }
    }
    
    console.log('========================');

    if (!filePart || !fileBuffer) {
      console.log('No file uploaded');
      return reply.code(400).send({
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          message: '请上传文件'
        }
      });
    }

    if (!filePart.filename.endsWith('.log')) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'FILE_INVALID_TYPE',
          message: '只支持.log格式的文件'
        }
      });
    }

    const dateTime = new Date(dateTimeStr);
    const dateStr = dateTime.toISOString().split('T')[0];

    const dateDir = path.join(config.upload.dir, userId.toString(), dateStr);
    await fs.mkdir(dateDir, { recursive: true });

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}_${randomId}.log`;
    const filePath = path.join(dateDir, fileName);

    await fs.writeFile(filePath, fileBuffer);

    const recordCount = fileBuffer.toString().split('\n').filter(line => line.includes('$GPGGA') || line.includes('$GNGGA')).length;
    const dataset = await prisma.dataset.create({
      data: {
        userId,
        fileName: filePart.filename,
        filePath,
        fileSize: fileBuffer.length,
        date: dateTime,
        recordCount,
        deviceId,
        deviceModel,
        uploadStatus: 'completed'
      }
    });

    return reply.code(201).send({
      success: true,
      data: {
        datasetId: dataset.id,
        fileName: filePart.filename,
        fileSize: fileBuffer.length,
        recordCount,
        uploadTime: dataset.createdAt
      }
    });
  } catch (error) {
    console.error('Upload API error:', error);
    throw error;
  }
};

export const getDatasets = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId;
    const query = request.query as any;

    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = { userId };

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
          createdAt: true
        }
      }),
      prisma.dataset.count({ where })
    ]);

    return reply.send({
      success: true,
      data: {
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

export const getDatasetDetail = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };

    const dataset = await prisma.dataset.findFirst({
      where: { id, userId }
    });

    if (!dataset) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'DATASET_NOT_FOUND',
          message: '数据集不存在'
        }
      });
    }

    let preview = '';
    try {
      const content = await fs.readFile(dataset.filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.includes('$GPGGA') || line.includes('$GNGGA'));
      preview = lines.slice(0, 10).join('\n');
    } catch (err) {
      preview = '无法读取文件内容';
    }

    return reply.send({
      success: true,
      data: {
        id: dataset.id,
        fileName: dataset.fileName,
        fileSize: dataset.fileSize,
        date: dataset.date,
        recordCount: dataset.recordCount,
        uploadTime: dataset.createdAt,
        deviceInfo: {
          deviceId: dataset.deviceId,
          model: dataset.deviceModel,
          firmware: dataset.deviceFirmware
        },
        preview
      }
    });
  } catch (error) {
    throw error;
  }
};

export const downloadDataset = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };

    const dataset = await prisma.dataset.findFirst({
      where: { id, userId }
    });

    if (!dataset) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'DATASET_NOT_FOUND',
          message: '数据集不存在'
        }
      });
    }

    const fileContent = await fs.readFile(dataset.filePath);

    reply.header('Content-Type', 'application/octet-stream');
    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(dataset.fileName)}"`);
    reply.header('Content-Length', dataset.fileSize);

    return reply.send(fileContent);
  } catch (error) {
    throw error;
  }
};

export const deleteDataset = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };

    const dataset = await prisma.dataset.findFirst({
      where: { id, userId }
    });

    if (!dataset) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'DATASET_NOT_FOUND',
          message: '数据集不存在'
        }
      });
    }

    try {
      await fs.unlink(dataset.filePath);
    } catch (err) {
      // 文件可能已被删除，继续删除数据库记录
    }

    await prisma.dataset.delete({
      where: { id }
    });

    return reply.send({
      success: true,
      message: '数据集已删除'
    });
  } catch (error) {
    throw error;
  }
};

export const checkFilesExist = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId;
    const { fileNames } = request.body as { fileNames: string[] };

    if (!fileNames || !Array.isArray(fileNames)) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '请提供文件名列表'
        }
      });
    }

    const existingFiles = await prisma.dataset.findMany({
      where: {
        userId,
        fileName: {
          in: fileNames
        }
      },
      select: {
        fileName: true,
        id: true,
        date: true,
        fileSize: true,
        createdAt: true
      }
    });

    const existingFileNames = new Set(existingFiles.map(f => f.fileName));
    const notUploaded = fileNames.filter(name => !existingFileNames.has(name));

    return reply.send({
      success: true,
      data: {
        existing: existingFiles.map(f => ({
          fileName: f.fileName,
          datasetId: f.id,
          date: f.date,
          fileSize: f.fileSize,
          uploadedAt: f.createdAt
        })),
        notUploaded
      }
    });
  } catch (error) {
    throw error;
  }
};

export const getStats = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId;

    const totalDatasets = await prisma.dataset.count({
      where: { userId }
    });

    const stats = await prisma.dataset.aggregate({
      where: { userId },
      _sum: {
        recordCount: true,
        fileSize: true
      },
      _min: {
        date: true
      },
      _max: {
        date: true
      }
    });

    const recentUploads = await prisma.dataset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        date: true,
        createdAt: true
      }
    });

    return reply.send({
      success: true,
      data: {
        totalDatasets,
        totalRecords: stats._sum.recordCount || 0,
        totalSize: stats._sum.fileSize || 0,
        dateRange: {
          earliest: stats._min.date,
          latest: stats._max.date
        },
        recentUploads: recentUploads.map(d => ({
          id: d.id,
          fileName: d.fileName,
          fileSize: d.fileSize,
          date: d.date,
          uploadTime: d.createdAt
        }))
      }
    });
  } catch (error) {
    throw error;
  }
};
