const given = require('../../steps/given');
const when = require('../../steps/when');
const then = require('../../steps/then');
const chance = require('chance').Chance();

const testUtils = require('../../lib/testUtils');

describe('When confirmUserSignup runs', () => {
  it('should save user profile to DynamoDB', async () => {
    const { name, email } = given.a_random_user();
    const username = chance.guid();

    await when.we_invoke_confirmUserSignUp(username, name, email);

    const ddbUser = await then.user_exists_in_UsersTable(username);

    expect(ddbUser).toMatchObject({
      id: username,
      name,
      createdAt: testUtils.expectCreatedAt,
      followersCount: 0,
      followingCount: 0,
      tweetsCount: 0,
      likesCount: 0,
    });

    const [firstName, lastName] = name.split(' ');
    expect(ddbUser.username).toContain(firstName);
    expect(ddbUser.username).toContain(lastName);
  });
});
