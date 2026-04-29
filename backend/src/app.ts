import {json} from 'body-parser';
import corsMiddleware from 'cors';
import express from 'express';
import controller from './controller';

export function createApp() {
  const app = express();

  app.use(corsMiddleware());
  app.use(json());
  app.use(controller);

  return app;
}
