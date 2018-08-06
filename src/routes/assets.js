const aws = require('aws-sdk');
const express = require('express');
const randomstring = require('randomstring');

const authResponse = require('../middleware/auth-response');
const authenticateJwt = require('../middleware/authenticate-jwt');

const router = express.Router();

router.use(authenticateJwt);

/**
 * - Upload file data as binary.
 * - Check file type.
 * - Crop, resize, and optimize quality.
 * - Convert to JPG.
 * - Return updated binary, URL, and signed PUT request with response.
 * - Client confirms unrelated form information and
 *   submits the image to S3 using signed request.
 */
router.get('/assets/signed-url', (req, res, next) => {
  // TODO: Verify user JWT!
  // TODO: Verify image type
  // TODO: Verify image size

  // req.on('data', (data) => {
  //   console.log('on.data', data);
  // });

  aws.config.region = process.env.AWS_S3_REGION;

  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_S3_REGION
  });

  // TODO: the file name is arbitrary?
  // - Autogenerate name from user ID.
  // TODO: File type can be derived from file data in request.
  // TODO: User should blindly submit file data with request.
  // "Sign this file for me!"
  // "Here you go, feel free to upload now."
  // const file = req.body.fileData;

  // const fileName = req.user._id + '-' + randomstring.generate();
  // const fileName = req.query.fileName;
  const fileType = req.query.fileType; // Restrict to png, jpg

  // console.log('fileName:', fileName, fileType);
  const fileName = req.user._id + '-' + randomstring.generate();
  const bucket = process.env.AWS_S3_BUCKET;
  console.log('bucket: ', bucket);

  const params = {
    Bucket: bucket,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  console.log(params);

  // TODO: Double-check auto-delete feature for old images.
  s3.getSignedUrl('putObject', params, (err, result) => {
    if (err) {
      // Don't pass the S3 error code to the client.
      if (err.code === 'MissingRequiredParameter') {
        // TODO: Create specific error code for this.
        const error = new Error(
          `The request must include both a 'fileName' and a 'fileType'.`
        );
        error.status = 400;
        next(error);
        return;
      }

      next(err);
      return;
    }

    const data = {
      signedRequest: result,
      url: `https://${bucket}.s3.amazonaws.com/${fileName}`
    };

    authResponse({
      data
    })(req, res, next);
  });
});

// This works, but it requires that the server upload the files.
// This might be too much for the server to handle.
// Ideally, the server could sign the request and return it back to the client.
// router.post('/assets/signed-url', (req, res, next) => {
//   // This bit does not work correctly. Need to consider using malter.
//   req.on('data', (data) => {
//     console.log('on.data', data);

//     const bucket = process.env.AWS_S3_BUCKET;
//     const s3 = new aws.S3({
//       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//       region: process.env.AWS_S3_REGION
//     });
//     aws.config.region = process.env.AWS_S3_REGION;

//     const fileName = req.user._id + '-' + randomstring.generate();
//     const params = {
//       Bucket: bucket,
//       Key: fileName,
//       Body: data,
//       Expires: 60,
//       ACL: 'public-read'
//     };

//     s3.putObject(params, (err, result) => {
//       if (err) {
//         console.log('error?', err);
//         next(err);
//         return;
//       }

//       console.log('SUCCESS!');

//       authResponse({
//         data: {}
//       })(req, res, next);
//     });
//   });
// });

module.exports = {
  router
};
