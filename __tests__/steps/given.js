const chance = require('chance').Chance();

const a_random_user = () => {
  const firstName = chance.first({ nationality: 'en' });
  const lastName = chance.last({ nationality: 'en' });
  const name = `${firstName} ${lastName}`;
  const password = chance.string({ length: 8 });
  const email = `${firstName}-${lastName}@test.com`;

  return {
    name,
    password,
    email,
  };
};

module.exports = {
  a_random_user,
};
