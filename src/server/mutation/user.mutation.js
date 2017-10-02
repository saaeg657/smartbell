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

import smsUtil from '../util/sms.util';
import {
  iamportCreateSubscribePayment,
  iamportDeleteSubscribePayment,
  iamportPayfromRegisterdUser
} from '../util/payment/iamportSubscribe.util';

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

const createUserMutation = {
  name: 'createUser',
  description: 'Register User to firebase via yetta server.',
  inputFields: {
    e: { type: new GraphQLNonNull(GraphQLString) },
    n: { type: new GraphQLNonNull(GraphQLString) },
    pw: { type: new GraphQLNonNull(GraphQLString) }
  },
  outputFields: {
    result: {
      type: GraphQLString,
      resolve: payload => payload.result
    }
  },
  mutateAndGetPayload: ({ e, pw, n }) => new Promise((resolve, reject) => {
    // create user at firebase
    admin.auth().createUser({
      email: e,
      emailVerified: false,
      password: pw,
      displayName: n,
      disabled: false
    })
      .then(createdUser => refs.user.root.child(createdUser.uid).set({
        id: createdUser.uid,
        e,
        n,
        pw: bcrypt.hashSync(pw, saltRounds),
        cAt: Date.now(),
        ...defaultSchema.user.root
      })
        .then(() => refs.user.userQualification.child(createdUser.uid).set({
          ...defaultSchema.user.orderQualification
        }))
        .then(() => refs.user.runnerQualification.child(createdUser.uid).set({
          ...defaultSchema.user.runnerQualification
        }))
      )
      .then(() => resolve({ result: 'OK' }))
      .catch(reject);
  })
};

const userSignInMutation = {
  name: 'userSignIn',
  description: 'user sign in to yetta server.',
  inputFields: {
    dt: { type: new GraphQLNonNull(GraphQLString) },
    d: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    result: { type: GraphQLString, resolve: payload => payload.result }
  },
  mutateAndGetPayload: ({ dt, d }, { user }) => new Promise((resolve, reject) => {
    if (user) {
      if (dt !== undefined && dt !== 'undefined') {
        return refs.user.root.child(user.uid).update({ dt, d })
          .then(() => resolve({ result: user.d && user.d === d ? 'OK' : 'WARN : There is another device logged in. That will be logged out.' }))
          .catch(reject);
      }
      return reject('No deviceToken Error.');
    }
    return reject('This mutation needs accessToken.');
  })
};

const userSignOutMutation = {
  name: 'userSignOut',
  description: 'user sign out from yetta server.',
  inputFields: {},
  outputFields: {
    result: { type: GraphQLString, resolve: payload => payload.result }
  },
  mutateAndGetPayload: ({ dt, d }, { user }) => new Promise((resolve, reject) => {
    if (user) {
      return refs.user.root.child(user.uid).update({ dt: null, d: null })
        .then(() => resolve({ result: 'OK' }))
        .catch(reject);
    }
    return reject('This mutation needs accessToken.');
  })
};

const userUpdateNameMutation = {
  name: 'userUpdateName',
  description: 'user update their name.',
  inputFields: {
    n: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    result: {
      type: GraphQLString,
      resolve: payload => payload.result
    }
  },
  mutateAndGetPayload: ({ n }, { user }) => new Promise((resolve, reject) =>
    refs.user.root.child(user.uid).child('n').set(n)
      .then(resolve({ result: 'OK' }))
      .catch(reject))
};

const userRequestPhoneVerifiactionMutation = {
  name: 'userRequestPhoneVerification',
  description: 'Send verification message to user.',
  inputFields: {
    p: { type: new GraphQLNonNull(GraphQLString) }
  },
  outputFields: {
    result: { type: GraphQLString, resolve: payload => payload.result }
  },
  mutateAndGetPayload: ({ p }, { user }) => new Promise((resolve, reject) => {
    if (user) {
      const code = smsUtil.getRandomCode();
      smsUtil.sendVerificationMessage(p, code);
      // mysql
      return refs.user.phoneVerificationInfo.child(user.uid).set({
        code,
        eAt: Date.now() + (120 * 1000)
      })
        .then(() => refs.user.root.child(user.uid).child('p').set(p))
        .then(() => resolve({ result: 'OK' }))
        .catch(reject);
    }
    return reject('This mutation needs accessToken');
  })
};

const userResponsePhoneVerificationMutation = {
  name: 'userResponsePhoneVerification',
  description: 'Verification of phoneNumber.',
  inputFields: {
    code: { type: new GraphQLNonNull(GraphQLInt) }
  },
  outputFields: {
    result: { type: GraphQLString, resolve: payload => payload.result }
  },
  mutateAndGetPayload: ({ code }, { user }) => new Promise((resolve, reject) => {
    if (user) {
      // mysql
      return refs.user.phoneVerificationInfo.child(user.uid).once('value')
        .then((snap) => {
          if (snap.val().code === code && snap.val().eAt > Date.now()) {
            return Promise.resolve();
          }
          if (snap.val().eAt < Date.now()) {
            // top priority
            return reject('time exceeded.');
          }
          return reject('wrong code.');
        })
        .then(() => refs.user.root.child(user.uid).child('isPV').set(true))
        .then(() => refs.user.phoneVerificationInfo.child(user.uid).child('vAt').set(Date.now()))
        .then(() => resolve({ result: 'OK' }))
        .catch(reject);
    }
    return reject('This mutation needs accessToken.');
  })
};

const userAgreeMutation = {
  name: 'userAgree',
  description: 'user agree agreement',
  inputFields: {
  },
  outputFields: {
    result: { type: GraphQLString, resolve: payload => payload.result }
  },
  mutateAndGetPayload: (_, { user }) => new Promise((resolve, reject) => {
    if (user) {
      return refs.user.userQualification.child(user.uid).update({
        isA: true,
        aAt: Date.now()
      })
      .then(() => resolve({ result: 'OK' }))
      .catch(reject);
    }
    return reject('This mutation needs accessToken.');
  })
};

const userAddAddressMutation = {
  name: 'userAddAddress',
  description: 'user add address',
  inputFields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    mAddr: { type: new GraphQLNonNull(GraphQLString) },
    sAddr: { type: new GraphQLNonNull(GraphQLString) },
    lat: { type: new GraphQLNonNull(GraphQLFloat) },
    lon: { type: new GraphQLNonNull(GraphQLFloat) }
  },
  outputFields: {
    result: { type: GraphQLString, resolve: payload => payload.result }
  },
  mutateAndGetPayload: ({ name, mAddr, sAddr, lat, lon }, { user }) => new Promise((resolve, reject) => {
    if (user) {
      return refs.user.address.child(user.uid).push().set({
        name,
        mAddr,
        sAddr,
        lat,
        lon
      })
      .then(() => resolve({ result: 'OK' }))
      .catch(reject);
    }
    return reject('This mutation needs accessToken.');
  })
};

const userSetModeMutation = {
  name: 'userSetMode',
  description: 'user set runner or user.',
  inputFields: {
    mode: { type: new GraphQLNonNull(GraphQLInt) },
  },
  outputFields: {
    result: { type: GraphQLString, resolve: payload => payload.result }
  },
  mutateAndGetPayload: ({ mode }, { user }) => new Promise((resolve, reject) => {
    if (user) {
      return refs.user.root.child(user.uid).child('mode').set(mode)
        .then(() => resolve({ result: 'OK' }))
        .catch(reject);
    }
    return reject('This mutation needs accessToken.');
  })
};

const userSetRunnerModeMutation = {
  name: 'userSetRunnerMode',
  description: 'user set runner mode(Active or inactive).',
  inputFields: {
    rMode: { type: new GraphQLNonNull(GraphQLInt) },
  },
  outputFields: {
    result: { type: GraphQLString, resolve: payload => payload.result }
  },
  mutateAndGetPayload: ({ rMode }, { user }) => new Promise((resolve, reject) => {
    if (user) {
      return refs.user.root.child(user.uid).child('rMode').set(rMode)
        .then(() => resolve({ result: 'OK' }))
        .catch(reject);
    }
    return reject('This mutation needs accessToken.');
  })
};

// TODO : impl add multiple payment method.
const userCreateIamportSubscribePaymentMutation = {
  name: 'userCreateIamportSubscribePayment',
  description: 'user set iamport subscribe payment',
  inputFields: {
    num: { type: new GraphQLNonNull(GraphQLString) },
    exp: { type: new GraphQLNonNull(GraphQLString) },
    birth: { type: new GraphQLNonNull(GraphQLString) },
    pw2: { type: new GraphQLNonNull(GraphQLString) }
  },
  outputFields: {
    result: { type: GraphQLString, resolve: payload => payload.result }
  },
  mutateAndGetPayload: ({ num, exp, birth, pw2 }, { user }) => new Promise((resolve, reject) => {
    if (user) {
      return iamportCreateSubscribePayment(user.uid, num, exp, birth, pw2)
       .then((result) => {
         console.log(JSON.stringify(result));
         return resolve({ result });
       })
        .catch(reject);
    }
    return reject('This mutation needs accessToken.');
  })
};

const userDeleteIamportSubscribePaymentMutation = {
  name: 'userDeleteIamportSubscribePayment',
  description: 'user set iamport subscribe payment',
  inputFields: {
  },
  outputFields: {
    result: { type: GraphQLString, resolve: payload => payload.result }
  },
  mutateAndGetPayload: (_, { user }) => new Promise((resolve, reject) => {
    if (user) {
      return iamportDeleteSubscribePayment(user.uid)
        .then((result) => {
          console.log(JSON.stringify(result));
          return resolve({ result });
        })
        .catch(reject);
    }
    return reject('This mutation needs accessToken.');
  })
};

const testPayfromRegisterdUserMutation = {
  name: 'testPayfromRegisterdUser',
  description: 'testPayfromRegisterdUser',
  inputFields: {
    oId: { type: new GraphQLNonNull(GraphQLString) },
    amount: { type: new GraphQLNonNull(GraphQLFloat) }
  },
  outputFields: {
    result: { type: GraphQLString, resolve: payload => payload.result }
  },
  mutateAndGetPayload: ({ oId, amount }, { user }) => new Promise((resolve, reject) => {
    if (user) {
      return iamportPayfromRegisterdUser(user.uid, oId, amount, oId)
        .then((result) => {
          console.log(JSON.stringify(result));
          return resolve({ result });
        })
        .catch(reject);
    }
    return reject('This mutation needs accessToken.');
  })
};


const UserMutation = {
  createUser: mutationWithClientMutationId(createUserMutation),
  userSignIn: mutationWithClientMutationId(userSignInMutation),
  userSignOut: mutationWithClientMutationId(userSignOutMutation),
  userUpdateName: mutationWithClientMutationId(userUpdateNameMutation),
  userRequestPhoneVerification: mutationWithClientMutationId(userRequestPhoneVerifiactionMutation),
  userResponsePhoneVerification: mutationWithClientMutationId(userResponsePhoneVerificationMutation),
  userAgree: mutationWithClientMutationId(userAgreeMutation),
  userAddAddress: mutationWithClientMutationId(userAddAddressMutation),
  userSetMode: mutationWithClientMutationId(userSetModeMutation),
  userSetRunnerMode: mutationWithClientMutationId(userSetRunnerModeMutation),
  userCreateIamportSubscribePayment: mutationWithClientMutationId(userCreateIamportSubscribePaymentMutation),
  userDeleteIamportSubscribePayment: mutationWithClientMutationId(userDeleteIamportSubscribePaymentMutation),
  testPayfromRegisterdUser: mutationWithClientMutationId(testPayfromRegisterdUserMutation),
  smartbellCreateUser: mutationWithClientMutationId(smartbellCreateUserMutation),
  smartbellSignIn: mutationWithClientMutationId(smartbellSignInMutation),
  smartbellRefreshDeviceToken: mutationWithClientMutationId(smartbellRefreshDeviceTokenMutation)
};

export default UserMutation;
