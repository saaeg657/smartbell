import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull
} from 'graphql';
import GeoFire from 'geofire';

import category from '../../shared/category/category';

import CoordinateType from '../type/coordinate.type';
import NodeType from '../type/node.type';
import { OrderType } from '../type/order.type';

import {
  refs
} from '../util/firebase/firebase.database.util';
import {
  userGeoFire,
  nodeGeoFire
} from '../util/firebase/firebase.geofire.util';

const UserQualificationType = new GraphQLObjectType({
  name: 'userQualification',
  description: 'Type of properties of port.',
  fields: () => ({
    isA: { type: GraphQLBoolean },
    aAt: { type: GraphQLFloat }
  })
});

const RunnerQualificationType = new GraphQLObjectType({
  name: 'runnerQualification',
  description: 'Type of properties of ship.',
  fields: () => ({
    isA: { type: GraphQLBoolean },
    aAt: { type: GraphQLFloat },
    isSA: { type: GraphQLBoolean },
    sAAt: { type: GraphQLFloat }
  })
});

const UserPaymentInfoType = new GraphQLObjectType({
  name: 'userPaymentInfo',
  description: 'UserPaymentInfoType of user.',
  fields: () => ({
    type: { type: GraphQLInt },
    num: { type: GraphQLString },
    provider: { type: GraphQLString }
  })
});

const RunnerPaymentInfoType = new GraphQLObjectType({
  name: 'runnerPaymentInfo',
  description: 'RunnerPaymentInfoType of user.',
  fields: () => ({
    type: { type: GraphQLInt },
    num: { type: GraphQLString },
    provider: { type: GraphQLString }
  })
});

const AddressType = new GraphQLObjectType({
  name: 'address',
  description: 'addressType of user.',
  fields: () => ({
    name: { type: GraphQLBoolean },
    mAddr: { type: GraphQLInt },
    sAddr: { type: GraphQLInt },
    lat: { type: GraphQLInt },
    lon: { type: GraphQLInt }
  })
});

const PhoneVerificationInfoType = new GraphQLObjectType({
  name: 'phoneVerificationInfo',
  description: 'phoneVerificationInfoType of user.',
  fields: () => ({
    code: { type: GraphQLInt },
    eAt: { type: GraphQLFloat },
    vAt: { type: GraphQLFloat }
  })
});

const HelpType = new GraphQLObjectType({
  name: 'help',
  description: 'helpType of user.',
  fields: () => ({
    comm: { type: GraphQLString },
    cAt: { type: GraphQLFloat },
    ans: { type: GraphQLString },
    ansAt: { type: GraphQLFloat }
  })
});

// How to use resolve.
// resolve: () => (source, { user })

const UserType = new GraphQLObjectType({
  name: 'user',
  description: 'UserType of Vinyl.',
  fields: () => ({
    id: { type: GraphQLString },
    nickname: { type: GraphQLString },
    email: { type: GraphQLString },
    profileImagePath: { type: GraphQLString },
    thumbnailImagePath: { type: GraphQLString },
    group: { type: GraphQLString }
  })
});

export default UserType;
