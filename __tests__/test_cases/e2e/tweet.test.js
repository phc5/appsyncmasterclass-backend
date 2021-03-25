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
  });
});
