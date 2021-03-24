const AWS = require('aws-sdk');
require('dotenv').config();

const user_exists_in_UsersTable = async (id) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();
  const { USERS_TABLE } = process.env;

  console.log(`Looking for user [${id}] in table [${USERS_TABLE}]`);
  const repsonse = await DynamoDB.get({
    TableName: USERS_TABLE,
    Key: {
      id,
    },
  }).promise();

  expect(repsonse.Item).toBeTruthy();
  return repsonse.Item;
};

module.exports = {
  
  user_exists_in_UsersTable,
};
