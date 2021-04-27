const TweetTypes = {
  TWEET: 'Tweet',
  RETWEET: 'Retweet',
  REPLY: 'Reply',
};

const DynamoDB = {
  MAX_BATCH_SIZE: 25,
};

const SearchModes = {
  PEOPLE: 'People',
  LATEST: 'Latest',
};

const HashTagModes = {
  PEOPLE: 'People',
  LATEST: 'Latest',
};

module.exports = {
  DynamoDB,
  SearchModes,
  TweetTypes,
  HashTagModes,
};
