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
  });
});
