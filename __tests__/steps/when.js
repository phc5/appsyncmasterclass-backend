require('dotenv').config();
const AWS = require('aws-sdk');
const fs = require('fs');
const velocityMapper = require('amplify-appsync-simulator/lib/velocity/value-mapper/mapper');
const velocityTemplate = require('amplify-velocity-template');
const { GraphQL, registerFragment } = require('../lib/graphql');

const myProfileFragment = `
  fragment myProfileFields on MyProfile {
    id
    name
    username
    imageUrl
    backgroundImageUrl
    bio
    location
    website
    birthdate
    createdAt
    followersCount
    followingCount
    tweetsCount
    likesCount
  }
`;

const otherProfileFragment = `
  fragment otherProfileFields on OtherProfile {
    id
    name
    username
    imageUrl
    backgroundImageUrl
    bio
    location
    website
    birthdate
    createdAt
    followersCount
    followingCount
    tweetsCount
    likesCount
    following
    followedBy
  }
`;

const iProfileFragment = `
  fragment iProfileFields on IProfile {
    ... on MyProfile {
      ... myProfileFields
    }

    ... on OtherProfile {
      ... otherProfileFields
    }
  }
`;

const tweetFragment = `
  fragment tweetFields on Tweet {
    id
    profile {
      ... iProfileFields
    }
    createdAt
    text
    repliesCount
    likesCount
    retweetsCount
    liked
    retweeted
  }
`;

const retweetFragment = `
  fragment retweetFields on Retweet {
    id
    profile {
      ... iProfileFields
    }
    createdAt
    retweetOf {
      ... on Tweet {
        ... tweetFields
      }

      ... on Reply {
        ... replyFields
      }
    }
  }
`;

const replyFragment = `
  fragment replyFields on Reply {
    id
    profile {
      ... iProfileFields
    }
    createdAt
    text
    repliesCount
    likesCount
    retweetsCount
    liked
    retweeted
    inReplyToTweet {
      id
      profile {
        ... iProfileFields
      }
      createdAt
      ... on Tweet {
        repliesCount
      }
      ... on Reply {
        repliesCount
      }
    }
    inReplyToUser {
      ... iProfileFields
    }
  }
`;

const iTweetFragment = `
  fragment iTweetFields on ITweet {
    ... on Tweet {
      ... tweetFields
    }

    ... on Retweet {
      ... retweetFields
    }

    ... on Reply {
      ... replyFields
    }
  }
`;

registerFragment('myProfileFields', myProfileFragment);
registerFragment('otherProfileFields', otherProfileFragment);
registerFragment('iProfileFields', iProfileFragment);
registerFragment('tweetFields', tweetFragment);
registerFragment('retweetFields', retweetFragment);
registerFragment('replyFields', replyFragment);
registerFragment('iTweetFields', iTweetFragment);

const a_user_calls_editMyProfile = async (user, input) => {
  const editMyProfile = `
    mutation editMyProfile($input: ProfileInput!) {
      editMyProfile(newProfile: $input) {
        ... myProfileFields

        tweets {
          nextToken
          tweets {
            ... iTweetFields
          }
        }
      }
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    editMyProfile,
    { input },
    user.accessToken
  );

  const profile = data.editMyProfile;

  console.log(`[${user.username}] - edited profile`);

  return profile;
};

const a_user_calls_follow = async (user, userId) => {
  const follow = `
    mutation follow($userId: ID!) {
      follow(userId: $userId)
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    follow,
    { userId },
    user.accessToken
  );
  const result = data.follow;

  console.log(`[${user.username}] - followed [${userId}]`);

  return result;
};

const a_user_calls_getImageUploadUrl = async (user, extension, contentType) => {
  const getImageUploadUrl = `
    query getImageUploadUrl($extension: String, $contentType: String) {
      getImageUploadUrl(extension: $extension, contentType: $contentType)
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    getImageUploadUrl,
    { extension, contentType },
    user.accessToken
  );

  const imageUploadUrl = data.getImageUploadUrl;

  console.log(`[${user.username}] - got image upload url`);

  return imageUploadUrl;
};

const a_user_calls_getLikes = async (user, userId, limit, nextToken) => {
  const getLikes = `
    query getLikes($userId: ID!, $limit: Int!, $nextToken: String) {
      getLikes(userId: $userId, limit: $limit, nextToken: $nextToken) {
        nextToken
        tweets {
          ... iTweetFields
        }
      }
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    getLikes,
    { userId, limit, nextToken },
    user.accessToken
  );

  const response = data.getLikes;

  console.log(
    `[${user.username}] - called getLikes with limit [${limit}] and nextToken [${nextToken}]`
  );

  return response;
};

const a_user_calls_getMyProfile = async (user) => {
  const getMyProfile = `
    query MyQuery {
      getMyProfile {
        ... myProfileFields

        tweets {
          nextToken
          tweets {
            ... iTweetFields
          }
        }
      }
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    getMyProfile,
    {},
    user.accessToken
  );

  const profile = data.getMyProfile;

  console.log(`[${user.username}] - fetched profile`);

  return profile;
};

const a_user_calls_getMyTimeline = async (user, limit, nextToken) => {
  const getMyTimeline = `
    query getMyTimeline($limit: Int!, $nextToken: String) {
      getMyTimeline(limit: $limit, nextToken: $nextToken) {
        nextToken
        tweets {
          ... iTweetFields
        }
      }
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    getMyTimeline,
    { limit, nextToken },
    user.accessToken
  );

  const result = data.getMyTimeline;

  console.log(
    `[${user.username}] - fetched timeline with limit [${limit}] and nextToken [${nextToken}]`
  );

  return result;
};

const a_user_calls_getTweets = async (user, userId, limit, nextToken) => {
  const getTweets = `
    query getTweets($userId: ID!, $limit: Int!, $nextToken: String) {
      getTweets(userId: $userId, limit: $limit, nextToken: $nextToken) {
        nextToken
        tweets {
          ... iTweetFields
        }
      }
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    getTweets,
    { userId, limit, nextToken },
    user.accessToken
  );

  const tweets = data.getTweets;

  console.log(
    `[${user.username}] - called getTweets with limit [${limit}] and nextToken [${nextToken}]`
  );

  return tweets;
};

const a_user_calls_getProfile = async (user, username) => {
  const getProfile = `
    query getProfile($username: String!) {
      getProfile(username: $username) {
        ... otherProfileFields
        tweets {
          nextToken
          tweets {
            ... iTweetFields
          }
        }
      }
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    getProfile,
    { username },
    user.accessToken
  );

  const profile = data.getProfile;

  console.log(`[${user.username}] - fetched profile for [${username}]`);

  return profile;
};

const a_user_calls_like = async (user, tweetId) => {
  const like = `
    mutation like($tweetId: ID!) {
      like(tweetId: $tweetId)
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    like,
    { tweetId },
    user.accessToken
  );

  const response = data.like;

  console.log(`[${user.username}] - has liked tweet [${tweetId}]`);

  return response;
};

const a_user_calls_reply = async (user, tweetId, text) => {
  const reply = `
    mutation reply($tweetId: ID!, $text: String!) {
      reply(tweetId: $tweetId, text: $text) {
        ... replyFields
      }
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    reply,
    { tweetId, text },
    user.accessToken
  );

  const response = data.reply;

  console.log(`[${user.username}] - has replied to tweet [${tweetId}]`);

  return response;
};

const a_user_calls_retweet = async (user, tweetId) => {
  const retweet = `
    mutation retweet($tweetId: ID!) {
      retweet(tweetId: $tweetId) {
        ... retweetFields
      }
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    retweet,
    { tweetId },
    user.accessToken
  );

  const response = data.retweet;

  console.log(`[${user.username}] - has retweeted tweet [${tweetId}]`);

  return response;
};

const a_user_calls_unretweet = async (user, tweetId) => {
  const unretweet = `
    mutation unretweet($tweetId: ID!) {
      unretweet(tweetId: $tweetId)
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    unretweet,
    { tweetId },
    user.accessToken
  );

  const response = data.unretweet;

  console.log(`[${user.username}] - has unretweeted tweet [${tweetId}]`);

  return response;
};

const a_user_calls_unlike = async (user, tweetId) => {
  const unlike = `
    mutation unlike($tweetId: ID!) {
      unlike(tweetId: $tweetId)
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    unlike,
    { tweetId },
    user.accessToken
  );

  const response = data.unlike;

  console.log(`[${user.username}] - has unlike tweet [${tweetId}]`);

  return response;
};

const a_user_calls_tweet = async (user, text) => {
  const tweet = `
    mutation Tweet($text: String!) {
      tweet(text: $text) {
        ... tweetFields
      }
    }
  `;

  const data = await GraphQL(
    process.env.API_URL,
    tweet,
    { text },
    user.accessToken
  );

  const newTweet = data.tweet;

  console.log(`[${user.username}] - tweeted`);

  return newTweet;
};

const a_user_signs_up = async (password, name, email) => {
  const cognito = new AWS.CognitoIdentityServiceProvider();

  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.WEB_COGNITO_USER_POOL_CLIENT_ID;

  const response = await cognito
    .signUp({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: 'name', Value: name }],
    })
    .promise();

  const username = response.UserSub;
  console.log(`[${email}] - user has signed up ${username}`);

  await cognito
    .adminConfirmSignUp({
      UserPoolId: userPoolId,
      Username: username,
    })
    .promise();

  console.log(`[${email}] -confirmed sign up`);

  return {
    username,
    name,
    email,
  };
};

const we_invoke_an_appsync_template = (templatePath, context) => {
  const template = fs.readFileSync(templatePath, { encoding: 'utf-8' });
  const ast = velocityTemplate.parse(template);
  const compiler = new velocityTemplate.Compile(ast, {
    valueMapper: velocityMapper.map,
    escape: false,
  });
  return JSON.parse(compiler.render(context));
};

const we_invoke_confirmUserSignUp = async (username, name, email) => {
  const handler = require('../../functions/confirm-user-signup').handler;
  const { AWS_REGION, COGNITO_USER_POOL_ID } = process.env;
  const context = {};
  const event = {
    version: '1',
    region: AWS_REGION,
    userPoolId: COGNITO_USER_POOL_ID,
    userName: username,
    triggerSource: 'PostConfirmation_ConfirmSignUp',
    request: {
      userAttributes: {
        sub: username,
        'cognito:email_alias': email,
        'cognito:user_status': 'CONFIRMED',
        email_verified: 'false',
        name: name,
        email: email,
      },
    },
    response: {},
  };

  await handler(event, context);
};

const we_invoke_getImageUploadUrl = async (
  username,
  extension,
  contentType
) => {
  const handler = require('../../functions/get-image-upload-url').handler;

  const context = {};
  const event = {
    identity: { username },
    arguments: {
      extension,
      contentType,
    },
  };

  return await handler(event, context);
};

const we_invoke_reply = async (username, tweetId, text) => {
  const handler = require('../../functions/reply').handler;

  const context = {};
  const event = {
    identity: { username },
    arguments: {
      tweetId,
      text,
    },
  };

  return await handler(event, context);
};

const we_invoke_retweet = async (username, tweetId) => {
  const handler = require('../../functions/retweet').handler;

  const context = {};
  const event = {
    identity: { username },
    arguments: {
      tweetId,
    },
  };

  return await handler(event, context);
};

const we_invoke_tweet = async (username, text) => {
  const handler = require('../../functions/tweet').handler;

  const context = {};
  const event = {
    identity: { username },
    arguments: {
      text,
    },
  };

  return await handler(event, context);
};

const we_invoke_unretweet = async (username, tweetId) => {
  const handler = require('../../functions/unretweet').handler;

  const context = {};
  const event = {
    identity: { username },
    arguments: {
      tweetId,
    },
  };

  return await handler(event, context);
};

module.exports = {
  a_user_calls_editMyProfile,
  a_user_calls_follow,
  a_user_calls_getImageUploadUrl,
  a_user_calls_getLikes,
  a_user_calls_getMyProfile,
  a_user_calls_getMyTimeline,
  a_user_calls_getProfile,
  a_user_calls_getTweets,
  a_user_calls_like,
  a_user_calls_reply,
  a_user_calls_retweet,
  a_user_calls_unlike,
  a_user_calls_unretweet,
  a_user_calls_tweet,
  a_user_signs_up,
  we_invoke_an_appsync_template,
  we_invoke_confirmUserSignUp,
  we_invoke_getImageUploadUrl,
  we_invoke_reply,
  we_invoke_retweet,
  we_invoke_tweet,
  we_invoke_unretweet,
};
