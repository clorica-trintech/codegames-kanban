import * as Ejs from 'ejs';
import { Server, Request } from 'hapi';

const npmManifest = require('../../package.json');

const server = new Server();

const host = '0.0.0.0';
const port = 8002;

server.connection({
  host,
  port,
  router: {
    stripTrailingSlash: true,
    isCaseSensitive: true
  }
});

const {
  version,
  name,
  description,
  author
} = npmManifest;

server.register([
  { register: require('inert') },
  { register: require('vision') },
], (registrationError: Error) => {
  if (registrationError) {
    throw registrationError;
  }

  server.route({
    method: 'GET',
    path: '/public/{param*}',
    handler: {
      directory: { path: 'src/backend/public' }
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    handler(request: Request, reply: any) {
      reply.view('app');
    }
  });

  // Basic layouts
  (server as any).views({
    engines: { html: Ejs },
    path: `src/backend/layout`
  });


  server.start(error => {
    if (error) {
      throw error;
    }
    console.log(`Server running at: ${server.info!.uri}`);
  });
});
