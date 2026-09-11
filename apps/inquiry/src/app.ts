import path from 'path';
import express, { Express } from 'express';
import morgan from 'morgan';
import { inquiriesRouter } from './routes/inquiries.routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use('/api/inquiries', inquiriesRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
