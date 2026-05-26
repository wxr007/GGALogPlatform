import 'dotenv/config';
import { initialize } from './app';
import { config } from './config/app';
import { prisma } from './config/database';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';

const ensureAdmin = async () => {
  const adminCount = await prisma.user.count({
    where: { isAdmin: true }
  });

  if (adminCount > 0) {
    console.log(`Found ${adminCount} admin user(s), skipping default admin creation`);
    return;
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminEmail || !adminPassword) {
    console.log('ADMIN_USERNAME, ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping default admin creation');
    return;
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { username: adminUsername }]
    }
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { isAdmin: true }
    });
    console.log(`User "${existingUser.username}" has been promoted to admin`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  await prisma.user.create({
    data: {
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      isAdmin: true
    }
  });
  console.log(`Default admin user "${adminUsername}" created successfully`);
};

const start = async () => {
  try {
    await fs.mkdir(config.upload.dir, { recursive: true });
    
    const app = await initialize();

    await ensureAdmin();
    
    await app.listen({
      port: config.port,
      host: config.host
    });
    
    console.log(`Server running at http://${config.host}:${config.port}`);
    console.log(`API docs available at http://localhost:${config.port}/api-docs`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
