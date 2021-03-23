require('dotenv').config();
const AWS = require('aws-sdk');

const a_user_signs_up = async (password, name, email) => {
  const cognito = new AWS.CognitoIdentityServiceProvider();

  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.WEB_COGNITO_USER_POOL_CLIENT_ID;

  const response = await cognito
    .signUp({
      ClientId: clientId,
      Username: email,
      Password: password,
      userAttributes: [{ Name: 'name', Value: name }],
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

  console.error.log(`[${email}] -confirmed sign up`);

  return {
    username,
    name,
    email,
  };
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

module.exports = {
  a_user_signs_up,
  we_invoke_confirmUserSignUp,
};
