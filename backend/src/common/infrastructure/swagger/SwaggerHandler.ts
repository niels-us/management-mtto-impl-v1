import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';

const logger = new Logger('SwaggerHandler');

export const swaggerHandler = async (event: any) => {
  try {
    const openApiPath = path.join(process.cwd(), 'openapi.json');
    const openApiContent = fs.readFileSync(openApiPath, 'utf-8');
    const openApiSpec = JSON.parse(openApiContent);

    const host = event?.headers?.Host || event?.headers?.host || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const stage = event?.requestContext?.stage || process.env.STAGE || 'DESA';
    const baseUrl = `${protocol}://${host}/${stage}`;

    openApiSpec.servers = [
      { url: baseUrl, description: 'Current Environment' },
      ...openApiSpec.servers.filter((s: any) => s.url !== baseUrl),
    ];

    const swaggerHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Maintenance API - Documentación</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <style>
        body { margin: 0; padding: 0; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
        var spec = ${JSON.stringify(openApiSpec)};
        SwaggerUIBundle({
            spec: spec,
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: 'StandaloneLayout'
        });
    </script>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
      body: swaggerHtml,
    };
  } catch (error) {
    logger.error('Error serving Swagger UI', error instanceof Error ? error.stack : String(error));
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error loading Swagger UI: ' + (error instanceof Error ? error.message : String(error)),
      }),
    };
  }
};

export const swaggerJsonHandler = async (event: any) => {
  try {
    const openApiPath = path.join(process.cwd(), 'openapi.json');
    const openApiContent = fs.readFileSync(openApiPath, 'utf-8');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: openApiContent,
    };
  } catch (error) {
    logger.error('Error serving OpenAPI JSON', error instanceof Error ? error.stack : String(error));
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error loading OpenAPI JSON' }),
    };
  }
};
