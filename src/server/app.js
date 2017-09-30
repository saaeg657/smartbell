import {
  GraphQLSchema,
  GraphQLObjectType
} from 'graphql';
import express from 'express';
import Raven from 'raven';
import graphqlHTTP from 'express-graphql';
import multer from 'multer';
import logger from 'winston';

import {
  startKafkaProducer
} from './util/kafka.util';
import authUtil from './util/auth.util';

import UserMutation from './mutation/user.mutation';
import deviceMutation from './mutation/device.mutation';
import UploadMutation from './mutation/upload.mutation';
import PushMutation from './mutation/push.mutation';
import AdminMutation from './mutation/admin.mutation';

import ViewerQuery from './query/viewer.query';
import UploadQuery from './query/upload.query';


  const app = express();

  const PORT = process.env.PORT;

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,authorization,permission,content-type');
    res.header('Access-Control-Allow-Methods', 'POST');
    next();
  });

// General Endpoint

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'rootQuery',
      description: 'Root Query of the Yetta Schema',
      fields: () => ({
        ...ViewerQuery
      })
    }),
    mutation: new GraphQLObjectType({
      name: 'rootMutation',
      description: 'Root Mutation of the Yetta Schema',
      fields: () => ({
        ...UserMutation,
        ...deviceMutation,
        ...PushMutation,
        ...AdminMutation
      })
    })
  });
  app.post(
    '/graphql',
    authUtil.apiProtector,
    graphqlHTTP((request) => {
      const startTime = Date.now();
      return {
        schema,
        rootValue: { request },
        /* eslint-disable no-param-reassign */
        extensions(ext) {
          // TODO : Find why `logger.debug(ext.result)` doesn't work on this part.
          // logger.debug(ext.result);
          console.log(ext.result);
          return { runTime: `${Date.now() - startTime}ms` };
        }
        /* eslint-enable no-param-reassign */
      };
    }));

// Upload Endpoint

  const uploadSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'rootQuery',
      description: 'Root Upload Query of the Yetta Schema',
      fields: () => ({
        ...UploadQuery
      })
    }),
    mutation: new GraphQLObjectType({
      name: 'rootMutation',
      description: 'Root Upload Mutation of the Yetta Schema',
      fields: () => ({
        ...UploadMutation
      })
    })
  });

  const storage = multer.memoryStorage();
  app.post(
    '/graphql/upload',
    authUtil.apiProtector,
    multer({ storage, limits: { fieldSize: 30 * 1000 * 1000, } }).single('file'),
    graphqlHTTP((request) => {
      const startTime = Date.now();
      return {
        schema: uploadSchema,
        rootValue: { request },
        extensions(ext) {
          // TODO : Find why `logger.debug(ext.result)` doesn't work on this part.
          // logger.debug(ext.result);
          console.log(ext.result);
          return { runTime: `${Date.now() - startTime}ms` };
        }
      };
    }));

  app.listen(PORT, () => {
    console.log(`Listening at ${PORT}`);
    // if (afterServerStartCallback) {
    //   console.log(`Listening at ${PORT}`);
    //   afterServerStartCallback();
    // }
  });


if (process.env.NODE_ENV !== 'test') {
  startKafkaProducer(() => {
    logger.info('Yetta graphql-server kafka producer ready.');
    startServer(() => {
      logger.info(`Yetta api ${process.env.NODE_ENV} server listening on port ${process.env.PORT}!`);
    });
  });
}
