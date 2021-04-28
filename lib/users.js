const _ = require('lodash');
const DynamoDB = require('aws-sdk/clients/dynamodb');
const DocumentClient = new DynamoDB.DocumentClient();

const { USERS_TABLE } = process.env;

const getUserByUsername = async (username) => {
  const resp = await DocumentClient.query({
    TableName: USERS_TABLE,
    KeyConditionExpression: 'username = :username',
    ExpressionAttributeValues: {
      ':username': username,
    },
    IndexName: 'byUsername',
    Limit: 1,
  }).promise();

  return _.get(resp, 'Items.0');
};

module.exports = {
  getUserByUsername,
};
