import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLString,
  GraphQLNonNull
} from 'graphql';
import {
  mutationWithClientMutationId
} from 'graphql-relay';

import admin from '../util/firebase/firebase';

import {
  defaultSchema,
  refs
} from '../util/firebase/firebase.database.util';

// const smartbellCreateDeviceMutation = {
//   name: 'smartbellCreateDevice',
//   description: 'create device',
//   inputFields: {},
//   outputFields: {
//     result: {
//       type: GraphQLString,
//       resolve: payload => payload.result
//     }
//   },
//   mutateAndGetPayload: () => new Promise((resolve, reject) => {
    
//   })
// }

const smartbellDeviceRegisterHostMutation = {
  name: 'smartbellDeviceRegisterHost',
  description: 'register host',
  inputFields: {
    deviceId: { type: new GraphQLNonNull(GraphQLString) },
    hostId: { type: new GraphQLNonNull(GraphQLString) }
  },
  outputFields: {
    result: {
      type: GraphQLString,
      resolve: payload => payload.result
    }
  },
  mutateAndGetPayload: ({ deviceId, hostId }) => new Promise((resolve, reject) => {
    return refs.device.root.child(deviceId).update({
      hostId
    })
    .then(() => refs.user.root.child(hostId).update({ deviceId }))
    .then(resolve({ result: 'OK' }))
    .catch(reject);
  })
}

const deviceMutation = {
  smartbellDeviceRegisterHost: mutationWithClientMutationId(smartbellDeviceRegisterHostMutation)
}

export default deviceMutation;
