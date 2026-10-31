import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLFormattedError } from 'graphql';
import { IngestionModule } from '../ingestion/ingestion.module';
import { VehicleResolver } from './vehicle.resolver';

@Module({
  imports: [
    IngestionModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/graphql',
      sortSchema: true,
      formatError: (error: GraphQLFormattedError) => {
        const code = error.extensions?.code;
        if (
          code === 'BAD_USER_INPUT' ||
          code === 'BAD_REQUEST' ||
          code === 'GRAPHQL_VALIDATION_FAILED'
        ) {
          return error;
        }
        return {
          message: 'Internal server error',
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        };
      },
    }),
  ],
  providers: [VehicleResolver],
})
export class VehicleGraphqlModule {}
