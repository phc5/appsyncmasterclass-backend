const given = require('../../steps/given');
const when = require('../../steps/when');

const testUtils = require('../../lib/testUtils');

describe('Given an authenticated user', () => {
  let user;

  beforeAll(async () => {
    user = await given.an_authenticated_user();
  });

  it('should allow user to fetch profile with getMyProfile', async () => {
    const profile = await when.a_user_calls_getMyProfile(user);

    expect(profile).toMatchObject({
      id: user.username,
      name: user.name,
      imageUrl: null,
      backgroundImageUrl: null,
      bio: null,
      location: null,
      website: null,
      birthdate: null,
      createdAt: testUtils.expectCreatedAt,
      followersCount: 0,
      followingCount: 0,
      tweetsCount: 0,
      likesCount: 0,
    });

    const [firstName, lastName] = user.name.split(' ');
    expect(profile.username).toContain(firstName);
    expect(profile.username).toContain(lastName);
  });
});
