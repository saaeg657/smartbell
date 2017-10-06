import bcrypt from 'bcrypt';
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

const saltRounds = 10;

const smartbellCreateUserMutation = {
  name: 'testSmartbell',
  description: 'test mutation for smartbell',
  inputFields: {
    email: { type: new GraphQLNonNull(GraphQLString) },
    emailVerified: { type: new GraphQLNonNull(GraphQLString) },
    nickname: { type: new GraphQLNonNull(GraphQLString) },
    thumbnailImagePath: { type: new GraphQLNonNull(GraphQLString) },
    profileImagePath: { type: new GraphQLNonNull(GraphQLString) },
    Id: { type: new GraphQLNonNull(GraphQLString) },
    UUID: { type: new GraphQLNonNull(GraphQLString) },
    deviceToken: { type: new GraphQLNonNull(GraphQLString) }
  },
  outputFields: {
    result: {
      type: GraphQLString,
      resolve: payload => payload.result
    }
  },
  mutateAndGetPayload: ({ email, emailVerified, nickname, thumbnailImagePath, profileImagePath, Id, UUID, deviceToken }) => new Promise ((resolve, reject) => {
    console.log(email, emailVerified, nickname, thumbnailImagePath, profileImagePath, Id, UUID, deviceToken);
    const userRef = refs.user.root.child(UUID);
    return userRef.once('value')
    .then((snap) => {
      if (snap.val() === null) {
        return admin.auth().createUser({
          uid: UUID,
          email,
          emailVerified: false,
          password: UUID,
          displayName: nickname,
          disabled: false
        })
          .then(createdUser => refs.user.root.child(createdUser.uid).set({
            id: createdUser.uid,
            email,
            emailVerified,
            nickname,
            thumbnailImagePath,
            profileImagePath,
            group: null,
            KId: Id,
            deviceToken
          }))
          .then(createdUser => resolve({ result: 'OK' }));
      }
      return userRef.update({
        nickname,
        emailVerified,
        thumbnailImagePath,
        profileImagePath,
        deviceToken
      })
      .then(() => resolve({ result: 'OK'}));
    })
    .catch(reject);
  })
}

const smartbellSignInMutation = {
  name: 'smartbellSignIn',
  description: 'signin',
  inputFields: {
    email: { type: new GraphQLNonNull(GraphQLString) },
    UUID: { type: new GraphQLNonNull(GraphQLString) },
    deviceToken: { type: new GraphQLNonNull(GraphQLString) }
  },
  outputFields: {
    result: {
      type: GraphQLString,
      resolve: payload => payload.result
    }
  },
  mutateAndGetPayload: ({ email, UUID, deviceToken }, { user }) => new Promise ((resolve, reject) => {
    return refs.user.root.child(user.uid).update({ deviceToken })
      .then(() => console.log(email, UUID, deviceToken))
      .then(() => resolve({ result: user.d && user.d === d ? 'OK' : 'WARN : There is another device logged in. That will be logged out.' }))
      .catch(reject);
  })
}

const smartbellSignOutMutation = {
  name: 'smartbellSignOut',
  description: 'signout',
  inputField: {
    
  },
  outputFields: {
    result: {
      type: GraphQLString,
      resolve: payload => payload.result
    }
  },
  mutateAndGetPayload: ({}, { user }) => new Promise((resolve, reject) => {
    return refs.user.root.child(user.uid).update({ deviceToken: null })
      .then(() => resolve({ result: 'OK' }))
      .catch(reject);
  })
}

const smartbellRefreshDeviceTokenMutation = {
  name: 'smartbellRefreshDeviceToken',
  description: 'refresh device token',
  inputFields: {
    deviceToken: { type: new GraphQLNonNull(GraphQLString) }
  },
  outputFields: {
    result: {
      type: GraphQLString,
      resolve: payload => payload.result
    }
  },
  mutateAndGetPayload: ({ deviceToken }, { user }) => new Promise((resolve, reject) => {
    console.log(user);
    if (user) {
      return refs.user.root.child(user.uid).update({ deviceToken })
        .then(() => resolve({ result: 'OK' }))
        .catch(reject);
    }
    return reject('No user.');
  })
}

const smartbellUpdateProfileMutation = {
  name: 'smartbellUpdateProfile',
  description: 'update profile',
  inputFields: {
    group: { type: new GraphQLNonNull(GraphQLString) }
  },
  outputFields: {
    result: {
      type: GraphQLString,
      resolve: payload => payload.result
    }
  },
  mutateAndGetPayload: ({ group }, { user }) => new Promise((resolve, reject) => {
    console.log(user);
    if (user) {
      return refs.user.root.child(user.uid).update({ group })
        .then(() => resolve({ result: 'OK' }))
        .catch(reject);
    }
    return reject('No user.');
  })
}

const smartbellRegisterDeviceMutation = {
  name: 'smartbellRegisterDeivce',
  description: 'register device',
  inputFields: {
    deviceId: { type: new GraphQLNonNull(GraphQLString) }
  },
  outputFields: {
    result: {
      type: GraphQLString,
      resolve: payload => payload.result
    }
  },
  mutateAndGetPayload: ({ deviceId }, { user }) => new Promise((resolve, reject) => {
    return refs.user.root.child(user.uid).update({ deviceId })
      .then(() => refs.device.root.child(deviceId).update({ hostId: user.uid }))
      .then(() => resolve({ result: 'OK' }))
      .catch(reject);
  })
}

const UserMutation = {
  smartbellCreateUser: mutationWithClientMutationId(smartbellCreateUserMutation),
  smartbellSignIn: mutationWithClientMutationId(smartbellSignInMutation),
  smartbellSignOut: mutationWithClientMutationId(smartbellSignOutMutation),
  smartbellRefreshDeviceToken: mutationWithClientMutationId(smartbellRefreshDeviceTokenMutation),
  smartbellUpdateProfile: mutationWithClientMutationId(smartbellUpdateProfileMutation)
};

export default UserMutation;
