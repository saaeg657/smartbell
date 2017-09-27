import {
  GraphQLString,
  GraphQLNonNull
} from 'graphql';
import {
  mutationWithClientMutationId
} from 'graphql-relay';
import {
  defaultSchema,
  refs
} from '../util/firebase/firebase.database.util';

import { sendPush } from '../util/firebase/firebase.messaging.util';

const smartbellSendPushMutation = {
  name: 'smartbellSendPush',
  description: 'sendPush',
  inputFields: {
    hostId: { type: new GraphQLNonNull(GraphQLString) },
    visitorId: { type: new GraphQLNonNull(GraphQLString) }
  },
  outputFields: {
    result: { type: GraphQLString, resolve: payload => payload.result }
  },
  mutateAndGetPayload: ({ hostId, visitorId }, { user }) => new Promise((resolve, reject) => {
      console.log(hostId, visitorId)
       return refs.user.root.child(visitorId).once('value')
        .then((snap) => {
          const visitor = snap.val();
          const message = {
            // notification: {
            //   title: 'testTitle',
            //   body: 'testBody'
            // },
            data: {
              email: visitor.email,
              nickname: visitor.nickname,
              profileImagePath: visitor.profileImagePath,
              thumbnailImagePath: visitor.thumbnailImagePath
            }
          }
          return refs.user.root.child(hostId).once('value')
          .then((snap) => {
            const host = snap.val();
            console.log(host.deviceToken);
            sendPush(host.deviceToken, message)
              .then(() => resolve({ result: 'OK'}))
          })
        })
        .catch(reject);
      // }
      // return reject('This mutation needs accessToken.');
  })
}

const sendPushMutation = {
  name: 'sendPushTest',
  description: 'sendPush',
  inputFields: {
    registrationToken: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    result: { type: GraphQLString, resolve: payload => payload.result }
  },
  mutateAndGetPayload: ({ registrationToken }) => new Promise((resolve, reject) =>
      // if (user) {
       sendPush(registrationToken)
         .then(() => resolve({ result: 'OK' }))
         .catch(reject)
      // }
      // return reject('This mutation needs accessToken.');
    )
};

const pushMutation = {
  smartbellSendPush: mutationWithClientMutationId(smartbellSendPushMutation),
  sendPush: mutationWithClientMutationId(sendPushMutation)
};


export default pushMutation;
