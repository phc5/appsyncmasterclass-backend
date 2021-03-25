require('dotenv').config();
const AWS = require('aws-sdk');
const fs = require('fs');
const velocityMapper = require('amplify-appsync-simulator/lib/velocity/value-mapper/mapper');
const velocityTemplate = require('amplify-velocity-template');
const GraphQL = require('../lib/graphql');

const a_user_calls_editMyProfile = async (user, input) => {
  const editMyProfile = `
    mutation editMyProfile($input: ProfileInput!) {
      editMyProfile(newProfile: $input) {
        backgroundImageUrl
        bio
        birthdate
        createdAt
        followersCount
        followingCount
        id
        imageUrl
        name
        username
        website
        tweetsCount
        likesCount
        location
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

const a_user_calls_getMyProfile = async (user) => {
  const getMyProfile = `
    query MyQuery {
      getMyProfile {
        id
        name
        createdAt
        backgroundImageUrl
        bio
        birthdate
        followersCount
        followingCount
        imageUrl
        likesCount
        location
        tweetsCount
        username
        website
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

const a_user_calls_getTweets = async (user, userId, limit, nextToken) => {
  const getTweets = `
    query getTweets($userId: ID!, $limit: Int!, $nextToken: String) {
      getTweets(userId: $userId, limit: $limit, nextToken: $nextToken) {
        nextToken
        tweets {
          id
          createdAt
          profile {
            id
            name
            username
          }

          ... on Tweet {
            text
            repliesCount
            likesCount
            retweetsCount
          }
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

const a_user_calls_tweet = async (user, text) => {
  const tweet = `
    mutation Tweet($text: String!) {
      tweet(text: $text) {
        id
        createdAt
        text
        repliesCount
        likesCount
        retweetsCount
        profile {
            id
            name
            username
          }
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

module.exports = {
  a_user_calls_editMyProfile,
  a_user_calls_getImageUploadUrl,
  a_user_calls_getMyProfile,
  a_user_calls_getTweets,
  a_user_calls_tweet,
  a_user_signs_up,
  we_invoke_an_appsync_template,
  we_invoke_confirmUserSignUp,
  we_invoke_getImageUploadUrl,
  we_invoke_tweet,
};
