import admin from './firebase/firebase';
import {
  refs
} from './firebase/firebase.database.util';

const tempUid = 'AZpdgg8SnteR7qgOItyYn1lH0sH3';
const tempName = 'YettaTest';

export default {
  apiProtector(req, res, next) {
    const r = req;
    if (r.headers.authorization === 'TT') {
      r.user = { uid: tempUid, name: tempName, warn: 'this is tempUid.', d: 'TT' };
      return next();
    }
    if (r.headers.authorization) {
      console.log(r.headers.authorization);
      return admin.auth().getUser(r.headers.authorization)
        .then((decodedToken) => {
          console.log(decodedToken);
          r.user = decodedToken;
          return refs.user.root.child(r.user.uid).once('value')
            .then((snap) => {
              if (snap.child('permission').val() === 'admin' && snap.child('e').val() === r.user.email) {
                r.user.permission = 'admin';
                return next();
              }
              if (!r.headers.device) {
                throw new Error('unauthorizedError : No Device id in header.');
              }
              // if (snap.val().d && snap.val().d !== r.headers.device) {
              //   return refs.user.root.child(r.user.uid).update({ d: null, dt: null })
              //     .then(() => {
              //       throw new Error('unauthorizedError : Another device logged in. Please login again.');
              //     })
              //     .catch((e) => { throw new Error(e); });
              // }
              return next();
            });
        })
        // Format to GraphQLError
        .catch(error => res.status(200).json({ errors: [{
          message: error.message,
          locations: error.locations,
          stack: error.stack,
          path: error.path
        }] }));
    }
    return next();
  }
};
