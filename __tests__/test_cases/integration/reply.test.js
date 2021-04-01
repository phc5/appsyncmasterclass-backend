const given = require('../../steps/given');
const when = require('../../steps/when');
const then = require('../../steps/then');
const chance = require('chance').Chance();

describe('Given two authenticated users', () => {
  let userA, userB;

  beforeAll(async () => {
    userA = await given.an_authenticated_user();
    userB = await given.an_authenticated_user();
  });

  describe('when userA sends a tweet', () => {
    let tweet;
    const text = chance.string({ length: 16 });

    beforeAll(async () => {
      tweet = await when.we_invoke_tweet(userA.username, text);
    });

    describe("when userB replies to userA's tweet", () => {
      const replyText = chance.string({ length: 16 });
      beforeAll(async () => {
        await when.we_invoke_reply(userB.username, tweet.id, replyText);
      });

      it('should save reply in Tweets table as a Reply', async () => {
        const reply = await then.reply_exists_in_TweetsTable(
          userB.username,
          tweet.id
        );
        expect(reply).toMatchObject({
          text: replyText,
          repliesCount: 0,
          likesCount: 0,
          retweetsCount: 0,
          inReplyToTweet: tweet.id,
          inReplyToUser: [userA.username],
        });
      });

      it('should increment repliesCount by 1 in Tweets table', async () => {
        const { repliesCount } = await then.tweet_exists_in_TweetsTable(
          tweet.id
        );
        expect(repliesCount).toEqual(1);
      });

      it('should increment tweetsCount by 1 of userB in Users table', async () => {
        await then.tweetsCount_is_updated_in_UsersTable(userB.username, 1);
      });

      it('should save the reply in the Timelines table for userB', async () => {
        const tweets = await then.there_are_N_tweets_in_TimelinesTable(
          userB.username,
          1
        );

        expect(tweets[0].inReplyToTweet).toEqual(tweet.id);
      });

      describe("when userA replies to userB's reply", () => {
        let userBsReply;
        const replyText = chance.string({ length: 16 });
        beforeAll(async () => {
          userBsReply = await then.reply_exists_in_TweetsTable(
            userB.username,
            tweet.id
          );
          await when.we_invoke_reply(userA.username, userBsReply.id, replyText);
        });

        it('should save reply in Tweets table as a Reply', async () => {
          const reply = await then.reply_exists_in_TweetsTable(
            userA.username,
            userBsReply.id
          );
          expect(reply).toMatchObject({
            text: replyText,
            repliesCount: 0,
            likesCount: 0,
            retweetsCount: 0,
            inReplyToTweet: userBsReply.id,
            inReplyToUser: expect.arrayContaining([
              userA.username,
              userB.username,
            ]),
          });
          expect(reply.inReplyToUser).toHaveLength(2);
        });
      });
    });

    describe("When userB retweets userA's tweet", () => {
      let userBsRetweet;
      beforeAll(async () => {
        await when.we_invoke_retweet(userB.username, tweet.id);
        userBsRetweet = await then.retweet_exists_in_TweetsTable(
          userB.username,
          tweet.id
        );
      });

      describe("when userA replies to userB's retweet", () => {
        const replyText = chance.string({ length: 16 });
        beforeAll(async () => {
          console.log(userBsRetweet);
          await when.we_invoke_reply(
            userA.username,
            userBsRetweet.id,
            replyText
          );
        });

        it('Saves the reply in the Tweets table', async () => {
          const reply = await then.reply_exists_in_TweetsTable(
            userA.username,
            userBsRetweet.id
          );

          expect(reply).toMatchObject({
            text: replyText,
            repliesCount: 0,
            likesCount: 0,
            retweetsCount: 0,
            inReplyToTweet: userBsRetweet.id,
            inReplyToUser: expect.arrayContaining([
              userA.username,
              userB.username,
            ]),
          });

          expect(reply.inReplyToUser).toHaveLength(2);
        });
      });
    });
  });
});
