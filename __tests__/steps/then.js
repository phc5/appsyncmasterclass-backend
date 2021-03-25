require('dotenv').config();
const AWS = require('aws-sdk');
const http = require('axios');
const fs = require('fs');

const tweet_exists_in_TimelinesTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();
  const { TIMELINES_TABLE } = process.env;

  console.log(
    `Looking for tweet [${tweetId}] for user [${userId}] in table [${TIMELINES_TABLE}]`
  );
  const response = await DynamoDB.get({
    TableName: TIMELINES_TABLE,
    Key: {
      userId,
      tweetId,
    },
  }).promise();

  expect(response.Item).toBeTruthy();
  return response.Item;
};

const tweet_exists_in_TweetsTable = async (id) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();
  const { TWEETS_TABLE } = process.env;

  console.log(`Looking for tweet [${id}] in table [${TWEETS_TABLE}]`);
  const response = await DynamoDB.get({
    TableName: TWEETS_TABLE,
    Key: {
      id,
    },
  }).promise();

  expect(response.Item).toBeTruthy();
  return response.Item;
};

const tweetsCount_is_updated_in_UsersTable = async (id, count) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();
  const { USERS_TABLE } = process.env;

  console.log(`Looking for user [${id}] in table [${USERS_TABLE}]`);

  const response = await DynamoDB.get({
    TableName: USERS_TABLE,
    Key: {
      id,
    },
  }).promise();

  expect(response.Item).toBeTruthy();
  expect(response.Item.tweetsCount).toEqual(count);
  return response.Item;
};

const user_can_upload_image_to_url = async (url, filepath, contentType) => {
  const data = fs.readFileSync(filepath);

  await http({
    method: 'PUT',
    url,
    headers: {
      'Content-Type': contentType,
    },
    data,
  });
  console.log('uplaoded image to', url);
};

const user_can_download_image_from = async (url) => {
  const response = await http(url);
  console.log('downloaded image from', url);

  return response.data;
};

const user_exists_in_UsersTable = async (id) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();
  const { USERS_TABLE } = process.env;

  console.log(`Looking for user [${id}] in table [${USERS_TABLE}]`);
  const response = await DynamoDB.get({
    TableName: USERS_TABLE,
    Key: {
      id,
    },
  }).promise();

  expect(response.Item).toBeTruthy();
  return response.Item;
};

module.exports = {
  tweet_exists_in_TimelinesTable,
  tweet_exists_in_TweetsTable,
  tweetsCount_is_updated_in_UsersTable,
  user_can_upload_image_to_url,
  user_can_download_image_from,
  user_exists_in_UsersTable,
};
