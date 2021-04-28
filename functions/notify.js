const _ = require('lodash');
const DynamoDB = require('aws-sdk/clients/dynamodb');
const graphql = require('graphql-tag');
const ulid = require('ulid');
const { TweetTypes } = require('../lib/constants');
const { mutate } = require('../lib/graphql');
const { getTweetById, extractMentions } = require('../lib/tweets');
const { getUserByUsername } = require('../lib/users');

module.exports.handler = async (event) => {
  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      const tweet = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);

      switch (tweet.__typename) {
        case TweetTypes.RETWEET:
          await notifyRetweet(tweet);
          break;
      }

      if (tweet.text) {
        const mentions = extractMentions(tweet.text);
        if (!_.isEmpty(mentions)) {
          await notifyMentioned(mentions, tweet);
        }
      }
    }
  }
};

async function notifyRetweet(tweet) {
  const retweetOf = await getTweetById(tweet.retweetOf);
  await mutate(
    graphql`
      mutation notifyRetweeted(
        $id: ID!
        $userId: ID!
        $tweetId: ID!
        $retweetedBy: ID!
        $retweetId: ID!
      ) {
        notifyRetweeted(
          id: $id
          userId: $userId
          tweetId: $tweetId
          retweetedBy: $retweetedBy
          retweetId: $retweetId
        ) {
          __typename
          ... on Retweeted {
            id
            type
            userId
            tweetId
            retweetedBy
            retweetId
            createdAt
          }
        }
      }
    `,
    {
      id: ulid.ulid(),
      userId: retweetOf.creator,
      tweetId: tweet.retweetOf,
      retweetId: tweet.id,
      retweetedBy: tweet.creator,
    }
  );
}

async function notifyMentioned(usernames, tweet) {
  const promises = usernames.map(async (username) => {
    const user = await getUserByUsername(username.replace('@', ''));
    if (!user) {
      return;
    }
    console.log(tweet);

    await mutate(
      graphql`
        mutation notifyMentioned(
          $id: ID!
          $userId: ID!
          $mentionedBy: ID!
          $mentionedByTweetId: ID!
        ) {
          notifyMentioned(
            id: $id
            userId: $userId
            mentionedBy: $mentionedBy
            mentionedByTweetId: $mentionedByTweetId
          ) {
            __typename
            ... on Mentioned {
              id
              type
              userId
              mentionedBy
              mentionedByTweetId
              createdAt
            }
          }
        }
      `,
      {
        id: ulid.ulid(),
        userId: user.id,
        mentionedBy: tweet.creator,
        mentionedByTweetId: tweet.id,
      }
    );
  });

  await Promise.all(promises);
}
