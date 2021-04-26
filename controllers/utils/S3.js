const aws = require("aws-sdk");
const path = require("path");


const ep = new aws.Endpoint(process.env.AWS_HOST);
const s3 = new aws.S3({
  signatureVersion: 'v4',
  region: process.env.AWS_REGION || 'eu-north-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_HOST ? ep : undefined,
  s3BucketEndpoint: process.env.AWS_S3_BUCKED_ENDPOINT,
  s3ForcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE,
});

const uploadToS3 = async (key, buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    s3.putObject(
        {
        Bucket: process.env.S3_BUCKET,
        ContentType: mimetype,
        Key: key,
        Body: buffer,
        ACL: 'public-read'
      },
      err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

const deleteFromS3 = async (key) => {
  return new Promise((resolve, reject) => {
    s3.deleteObject(
      {
        Bucket: process.env.S3_BUCKET,
        Key: key,
      },
      err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

const getImageKey = ({ fileName, vkGroupId }) => {
  const date = new Date();
  const extName = path.extname(fileName);

  return`img/${vkGroupId}/${date.toISOString().slice(0,7)}/${date.getTime() + extName}`;
};

module.exports = { uploadToS3, deleteFromS3, getImageKey };
