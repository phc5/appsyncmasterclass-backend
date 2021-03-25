require('dotenv').config();
const AWS = require('aws-sdk');
const http = require('axios');
const fs = require('fs');

const user_can_upload_image_to_url = async (url, filepath, contentType) => {
  const data = fs.readFileSync(filepath);

  await http({
    method: 'PUT',
    url,
    headers: {
      'Content-Type': contentType,
    },
    data,
  });
  console.log('uplaoded image to', url);
};

const user_can_download_image_from = async (url) => {
  const response = await http(url);
  console.log('downloaded image from', url);

  return response.data;
};

const user_exists_in_UsersTable = async (id) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient();
  const { USERS_TABLE } = process.env;

  console.log(`Looking for user [${id}] in table [${USERS_TABLE}]`);
  const repsonse = await DynamoDB.get({
    TableName: USERS_TABLE,
    Key: {
      id,
    },
  }).promise();

  expect(repsonse.Item).toBeTruthy();
  return repsonse.Item;
};

module.exports = {
  user_can_upload_image_to_url,
  user_can_download_image_from,
  user_exists_in_UsersTable,
};
