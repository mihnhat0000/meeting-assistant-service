// import { TypeOrmModuleOptions } from '@nestjs/typeorm';
// import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
// import { snakeCase } from 'typeorm/util/StringUtils';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import * as env from 'dotenv';
env.config();

// Custom snake case naming strategy
// class CustomSnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
//   tableName(className: string, customName: string): string {
//     return customName ? customName : snakeCase(className);
//   }

//   columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
//     return snakeCase(embeddedPrefixes.concat(customName ? customName : propertyName).join('_'));
//   }

//   relationName(propertyName: string): string {
//     return snakeCase(propertyName);
//   }

//   joinColumnName(relationName: string, referencedColumnName: string): string {
//     return snakeCase(relationName + '_' + referencedColumnName);
//   }
//   joinTableName(firstTableName: string, secondTableName: string, firstPropertyName: string): string {
//     return snakeCase(firstTableName + '_' + firstPropertyName.replace(/\./gi, '_') + '_' + secondTableName);
//   }

//   joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
//     return snakeCase(tableName + '_' + (columnName ? columnName : propertyName));
//   }

//   classTableInheritanceParentColumnName(parentTableName: string, parentTableIdPropertyName: string): string {
//     return snakeCase(parentTableName + '_' + parentTableIdPropertyName);
//   }
// }

// export const getTypeOrmConfig = (): TypeOrmModuleOptions => ({
//   type: 'mysql',
//   host: process.env.DB_HOST || 'localhost',
//   port: parseInt(process.env.DB_PORT || '3306', 10),
//   username: process.env.DB_USERNAME || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'meeting_assistant',
//   entityPrefix: process.env.DB_ENTITY_PREFIX || '',
//   namingStrategy: new CustomSnakeNamingStrategy(),
//   autoLoadEntities: true,
//   synchronize: process.env.NODE_ENV !== 'production', // Only sync in non-production
//   logging: process.env.NODE_ENV === 'development',
// });

export const dataSourceOptions: DataSourceOptions = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  logging: process.env.TYPEORM_LOGGING === 'true',
  username: process.env.DB_USERNAME || '',
  password: process.env.DB_PASSWORD || '',
  type: 'mysql',
  database: process.env.DB_NAME || '',
  entityPrefix: process.env.DB_ENTITY_PREFIX || '',
  entities: ['dist/**/*.entity.js'],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  charset: 'utf8mb4',
  migrations: ['dist/db/migrations/*.js'],
  namingStrategy: new SnakeNamingStrategy(),
  // cache: process.env.REDIS_HOST
  //   ? { type: 'redis', options: { socket: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT } }, ignoreErrors: true }
  //   : false,
};

const myDataSource = new DataSource(dataSourceOptions);

export default myDataSource;
