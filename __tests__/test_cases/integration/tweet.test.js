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
      tweet = await when.we_invoke_tweet(user.username, text);
    });

    it('should save a tweet in the TweetsTable in DDB', async () => {
      await then.tweet_exists_in_TweetsTable(tweet.id);
    });

    it('should save a tweet in the TimelinesTable in DDB', async () => {
      await then.tweet_exists_in_TimelinesTable(user.username, tweet.id);
    });

    it('should increment tweets count in the UsersTable in DDB by 1', async () => {
      await then.tweetsCount_is_updated_in_UsersTable(user.username, 1);
    });
  });
});
