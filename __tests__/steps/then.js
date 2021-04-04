require('dotenv').config();
const AWS = require('aws-sdk');
const http = require('axios');
const fs = require('fs');
const _ = require('lodash');

const reply_exists_in_TweetsTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();
  const { TWEETS_TABLE } = process.env;

  console.log(
    `Looking for reply by [${userId}] to [${tweetId}] in table [${TWEETS_TABLE}]`
  );

  const response = await DynamoDB.query({
    TableName: TWEETS_TABLE,
    IndexName: 'repliesForTweet',
    KeyConditionExpression: 'inReplyToTweet = :tweetId',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':tweetId': tweetId,
    },
    FilterExpression: 'creator = :userId',
  }).promise();

  const reply = _.get(response, 'Items.0');

  expect(reply).toBeTruthy();
  return reply;
};

const retweet_does_not_exists_in_RetweetsTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();
  const { RETWEETS_TABLE } = process.env;

  console.log(
    `Looking for retweet of [${tweetId}] for user [${userId}] in table [${RETWEETS_TABLE}]`
  );
  const response = await DynamoDB.get({
    TableName: RETWEETS_TABLE,
    Key: {
      userId,
      tweetId,
    },
  }).promise();

  expect(response.Item).not.toBeTruthy();
  return response.Item;
};

const retweet_does_not_exists_in_TweetsTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();
  const { TWEETS_TABLE } = process.env;

  console.log(`Looking for retweet of[${tweetId}] in table [${TWEETS_TABLE}]`);
  const response = await DynamoDB.query({
    TableName: TWEETS_TABLE,
    IndexName: 'retweetsByCreator',
    KeyConditionExpression: 'creator = :creator AND retweetOf = :tweetId',
    ExpressionAttributeValues: {
      ':creator': userId,
      ':tweetId': tweetId,
    },
    Limit: 1,
  }).promise();

  expect(response.Items).toHaveLength(0);
  return null;
};

const retweet_exists_in_RetweetsTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();
  const { RETWEETS_TABLE } = process.env;

  console.log(
    `Looking for retweet of [${tweetId}] for user [${userId}] in table [${RETWEETS_TABLE}]`
  );
  const response = await DynamoDB.get({
    TableName: RETWEETS_TABLE,
    Key: {
      userId,
      tweetId,
    },
  }).promise();

  expect(response.Item).toBeTruthy();
  return response.Item;
};

const retweet_exists_in_TweetsTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();
  const { TWEETS_TABLE } = process.env;

  console.log(`Looking for retweet of[${tweetId}] in table [${TWEETS_TABLE}]`);
  const response = await DynamoDB.query({
    TableName: TWEETS_TABLE,
    IndexName: 'retweetsByCreator',
    KeyConditionExpression: 'creator = :creator AND retweetOf = :tweetId',
    ExpressionAttributeValues: {
      ':creator': userId,
      ':tweetId': tweetId,
    },
    Limit: 1,
  }).promise();

  const retweet = _.get(response, 'Items[0]');

  expect(retweet).toBeTruthy();
  return retweet;
};

const there_are_N_tweets_in_TimelinesTable = async (userId, n) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();
  const { TIMELINES_TABLE } = process.env;

  console.log(
    `Looking for [${n}] tweets for user [${userId}] in table [${TIMELINES_TABLE}]`
  );
  const response = await DynamoDB.query({
    TableName: TIMELINES_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: false,
  }).promise();

  expect(response.Items).toHaveLength(n);
  return response.Items;
};

const tweet_does_not_exist_in_TimelinesTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();

  console.log(
    `looking for tweet [${tweetId}] for user [${userId}] in table [${process.env.TIMELINES_TABLE}]`
  );
  const resp = await DynamoDB.get({
    TableName: process.env.TIMELINES_TABLE,
    Key: {
      userId,
      tweetId,
    },
  }).promise();

  expect(resp.Item).not.toBeTruthy();

  return resp.Item;
};

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
  reply_exists_in_TweetsTable,
  retweet_does_not_exists_in_TweetsTable,
  retweet_does_not_exists_in_RetweetsTable,
  retweet_exists_in_RetweetsTable,
  retweet_exists_in_TweetsTable,
  there_are_N_tweets_in_TimelinesTable,
  tweet_does_not_exist_in_TimelinesTable,
  tweet_exists_in_TimelinesTable,
  tweet_exists_in_TweetsTable,
  tweetsCount_is_updated_in_UsersTable,
  user_can_upload_image_to_url,
  user_can_download_image_from,
  user_exists_in_UsersTable,
};
