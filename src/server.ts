import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const submittedContacts: Array<{
  name: string;
  email: string;
  role: string;
  website: string;
  message: string;
  submittedAt: string;
}> = [];

app.use(express.json());

app.post('/api/contact', (req, res) => {
  const body = req.body as Partial<{
    name: string;
    email: string;
    role: string;
    website: string;
    message: string;
  }>;

  const name = body.name?.trim() ?? '';
  const email = body.email?.trim() ?? '';
  const role = body.role?.trim() ?? '';
  const website = body.website?.trim() ?? '';
  const message = body.message?.trim() ?? '';

  if (name.length < 2 || !email.includes('@') || !role || message.length < 20) {
    res.status(400).json({ message: 'Invalid form submission.' });
    return;
  }

  submittedContacts.push({
    name,
    email,
    role,
    website,
    message,
    submittedAt: new Date().toISOString()
  });

  res.status(200).json({
    message: `Thanks ${name}, your message was submitted successfully.`
  });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
