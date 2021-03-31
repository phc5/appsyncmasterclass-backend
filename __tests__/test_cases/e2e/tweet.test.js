require('dotenv').config();
const path = require('path');
const given = require('../../steps/given');
const when = require('../../steps/when');
const then = require('../../steps/then');
const chance = require('chance').Chance();

const testUtils = require('../../lib/testUtils');

describe('Given an authenticated user', () => {
  let user;

  beforeAll(async () => {
    user = await given.an_authenticated_user();
  });

  describe('when user sends a tweet', () => {
    let tweet;
    const text = chance.string({ length: 16 });
    beforeAll(async () => {
      tweet = await when.a_user_calls_tweet(user, text);
    });

    it('should return the new tweet', async () => {
      expect(tweet).toMatchObject({
        text: text,
        repliesCount: 0,
        likesCount: 0,
        retweetsCount: 0,
        liked: false,
      });
    });

    describe('when user calls getTweets', () => {
      let tweets, nextToken;
      beforeAll(async () => {
        const result = await when.a_user_calls_getTweets(
          user,
          user.username,
          25
        );
        tweets = result.tweets;
        nextToken = result.nextToken;
      });

      it('should see new tweet when he calls getTweets', async () => {
        expect(nextToken).toBeNull();
        expect(tweets.length).toEqual(1);
        expect(tweets[0]).toEqual(tweet);
      });

      it('should not be able to ask for more than 25 tweets per page', async () => {
        await expect(
          when.a_user_calls_getTweets(user, user.username, 26)
        ).rejects.toMatchObject({
          message: expect.stringContaining('Max limit is 25'),
        });
      });
    });

    describe('when user calls getMyTimeline', () => {
      let tweets, nextToken;
      beforeAll(async () => {
        const result = await when.a_user_calls_getMyTimeline(user, 25);
        tweets = result.tweets;
        nextToken = result.nextToken;
      });

      it('should see new tweet when he calls getTweets', async () => {
        expect(nextToken).toBeNull();
        expect(tweets.length).toEqual(1);
        expect(tweets[0]).toEqual(tweet);
      });

      it('should not be able to ask for more than 25 tweets per page', async () => {
        await expect(
          when.a_user_calls_getMyTimeline(user, 26)
        ).rejects.toMatchObject({
          message: expect.stringContaining('Max limit is 25'),
        });
      });
    });

    describe('when user likes a tweet', () => {
      beforeAll(async () => {
        await when.a_user_calls_like(user, tweet.id);
      });

      it('should set Tweet.liked as true', async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(user, 25);
        expect(tweets).toHaveLength(1);
        expect(tweets[0].id).toEqual(tweet.id);
        expect(tweets[0].liked).toEqual(true);
      });

      it('should fail if user likes an already liked tweet', async () => {
        await expect(() =>
          when.a_user_calls_like(user, tweet.id)
        ).rejects.toMatchObject({
          message: expect.stringContaining('DynamoDB transaction error'),
        });
      });

      it('should see tweet when he calls getLikes', async () => {
        const { tweets, nextToken } = await when.a_user_calls_getLikes(
          user,
          user.username,
          25
        );

        expect(nextToken).toBeNull();
        expect(tweets).toHaveLength(1);
        expect(tweets[0]).toMatchObject({
          ...tweet,
          liked: true,
          likesCount: 1,
          profile: {
            ...tweet.profile,
            likesCount: 1,
          },
        });
      });
    });

    describe('when user unlikes a tweet', () => {
      beforeAll(async () => {
        await when.a_user_calls_unlike(user, tweet.id);
      });

      it('should set Tweet.liked as false', async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(user, 25);
        expect(tweets).toHaveLength(1);
        expect(tweets[0].id).toEqual(tweet.id);
        expect(tweets[0].liked).toEqual(false);
      });

      it('should fail if user unlikes an already unliked tweet', async () => {
        await expect(() =>
          when.a_user_calls_unlike(user, tweet.id)
        ).rejects.toMatchObject({
          message: expect.stringContaining('DynamoDB transaction error'),
        });
      });

      it('should not see tweet when he calls getLikes after unliking tweet', async () => {
        const { tweets, nextToken } = await when.a_user_calls_getLikes(
          user,
          user.username,
          25
        );

        expect(nextToken).toBeNull();
        expect(tweets).toHaveLength(0);
      });
    });

    describe('when a user retweets a tweet', () => {
      beforeAll(async () => {
        await when.a_user_calls_retweet(user, tweet.id);
      });

      it('should see retweet when user calls getTweets', async () => {
        const { tweets } = await when.a_user_calls_getTweets(
          user,
          user.username,
          25
        );

        expect(tweets).toHaveLength(2);
        expect(tweets[0]).toMatchObject({
          profile: {
            id: user.username,
            tweetsCount: 2,
          },
          retweetOf: {
            ...tweet,
            retweetsCount: 1,
            retweeted: true,
            profile: {
              id: user.username,
              tweetsCount: 2,
            },
          },
        });

        expect(tweets[1]).toMatchObject({
          ...tweet,
          retweetsCount: 1,
          retweeted: true,
          profile: {
            id: user.username,
            tweetsCount: 2,
          },
        });
      });

      it('should not see retweet when user calls getMyTimeline', async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(user, 25);

        expect(tweets).toHaveLength(1);
        expect(tweets[0]).toMatchObject({
          ...tweet,
          retweetsCount: 1,
          retweeted: true,
          profile: {
            id: user.username,
            tweetsCount: 2,
          },
        });
      });
    });
  });
});
