import 'dotenv/config';
import { initialize } from './app';
import { config } from './config/app';
import fs from 'fs/promises';

const start = async () => {
  try {
    await fs.mkdir(config.upload.dir, { recursive: true });
    
    const app = await initialize();
    
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
