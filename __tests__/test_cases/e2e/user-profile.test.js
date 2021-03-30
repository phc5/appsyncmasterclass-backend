require('dotenv').config();
const path = require('path');
const given = require('../../steps/given');
const when = require('../../steps/when');
const then = require('../../steps/then');
const chance = require('chance').Chance();

const testUtils = require('../../lib/testUtils');

describe('Given an authenticated user', () => {
  let user, profile;

  beforeAll(async () => {
    user = await given.an_authenticated_user();
  });

  it('should allow user to fetch profile with getMyProfile', async () => {
    profile = await when.a_user_calls_getMyProfile(user);

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
      tweets: {
        nextToken: null,
        tweets: [],
      },
    });

    const [firstName, lastName] = user.name.split(' ');
    expect(profile.username).toContain(firstName);
    expect(profile.username).toContain(lastName);
  });

  it('should allow user to get an URL to upload a new profile image', async () => {
    const uploadUrl = await when.a_user_calls_getImageUploadUrl(
      user,
      '.png',
      'image/png'
    );

    const regex = new RegExp(
      `https://${process.env.BUCKET_NAME}.s3-accelerate.amazonaws.com/${user.username}/.*\.png\?.*Content-Type=image%2Fpng.*`
    );
    expect(uploadUrl).toMatch(regex);

    const filePath = path.join(__dirname, '../../data/screenshot.png');
    await then.user_can_upload_image_to_url(uploadUrl, filePath, 'image/png');

    const downloadUrl = uploadUrl.split('?')[0];
    await then.user_can_download_image_from(downloadUrl);
  });

  it('should allow user to edit profile with editMyProfile', async () => {
    const newName = chance.first();
    const input = {
      name: newName,
    };
    const newProfile = await when.a_user_calls_editMyProfile(user, input);

    expect(newProfile).toMatchObject({
      ...profile,
      name: newName,
    });
  });
});
