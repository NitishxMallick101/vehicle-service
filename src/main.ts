import 'reflect-metadata';
import { ConsoleLogger, INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { enabledLogLevels } from './config/log-levels';

function createApiDocumentation(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Vehicle Makes & Types API')
    .setDescription(
      'OpenAPI documentation for the GraphQL HTTP transport. The GraphQL schema exposed at /graphql is the source of truth for query fields and types.',
    )
    .setVersion('1.0.0')
    .addTag('GraphQL')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  document.paths['/graphql'] = {
    post: {
      tags: ['GraphQL'],
      summary: 'Execute a GraphQL query',
      description:
        'Send a GraphQL operation in the JSON request body. Use the examples to query makes or look up a single make. GraphQL validation and execution errors are returned in the GraphQL errors envelope.',
      operationId: 'executeGraphQLQuery',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['query'],
              properties: {
                query: { type: 'string', description: 'GraphQL query document' },
                operationName: { type: 'string' },
                variables: { type: 'object', additionalProperties: true },
              },
            },
            examples: {
              listMakes: {
                summary: 'List vehicle makes and their types',
                value: {
                  query:
                    'query { makes(limit: 100, offset: 0) { makeId makeName vehicleTypes { typeId typeName } } }',
                },
              },
              findMake: {
                summary: 'Look up one make',
                value: {
                  query:
                    'query { make(makeId: 440) { makeId makeName vehicleTypes { typeId typeName } } }',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description:
            'GraphQL response. The data object contains the selected query field; execution errors may also be included in errors.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'object', additionalProperties: true },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        message: { type: 'string' },
                        extensions: {
                          type: 'object',
                          additionalProperties: true,
                        },
                      },
                    },
                  },
                },
              },
              examples: {
                makes: {
                  summary: 'Successful makes query',
                  value: {
                    data: {
                      makes: [
                        {
                          makeId: '440',
                          makeName: 'FORD',
                          vehicleTypes: [
                            { typeId: '2', typeName: 'Passenger Car' },
                          ],
                        },
                      ],
                    },
                  },
                },
                make: {
                  summary: 'Successful single make query',
                  value: {
                    data: {
                      make: {
                        makeId: '440',
                        makeName: 'FORD',
                        vehicleTypes: [
                          { typeId: '2', typeName: 'Passenger Car' },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '400': { description: 'Malformed HTTP request or unsupported content type' },
      },
    },
  };
  return document;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: true,
      logLevels: enabledLogLevels(process.env.LOG_LEVEL ?? 'log'),
    }),
  });
  const config = app.get(ConfigService);
  const port = Number(config.getOrThrow<string>('PORT'));
  const logLevel = config.getOrThrow<string>('LOG_LEVEL');
  app.useLogger(
    new ConsoleLogger({
      json: true,
      logLevels: enabledLogLevels(logLevel),
    }),
  );
  const document = createApiDocumentation(app);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: { displayRequestDuration: true },
  });
  app.enableShutdownHooks();
  await app.listen(port);
  new Logger('Bootstrap').log(
    JSON.stringify({ event: 'application_started', port }),
  );
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(JSON.stringify({ event: 'application_start_failed', error: message }));
  process.exitCode = 1;
});
