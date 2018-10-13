'use strict';

const aws = require('aws-sdk');
const postmark = require('postmark');
const qs = require('query-string');
const extend = require('lodash.assignin');
const isPlainObject = require('lodash.isplainobject');
import * as dynamoDbLib from "./libs/dynamodb-lib"

// Postmark Email Templates are 7 digit codes. The function below specifies that

const templates = (applicant) => {
  return applicant ? 0000001 : 0000002;
}

class Service {
  constructor() {

  }

  prepEmail(person={}, toAddress='', applicant=false) {
    return {
      "From": "admin@fullstackapprenticeship.com",
      "To": toAddress,
      "TemplateId": templates(applicant),
      "TemplateModel": {
        "name": person.name,
        "_replyto": person._replyto,
        "email": person.email,
        "message": person.message,
        "country": person.country
      }
    };
  }

  sendEmailBatch(messages) {
    console.log('Trying to send emails.');
    let client = new postmark.Client(process.env.POSTMARK_KEY);
    return new Promise((resolve, reject) => {
      client.sendEmailBatch(messages, (err, done) => {
        if (!err) {
          console.log('Successfully sent emails');
          return resolve(done);
        } else {
          return reject(err);
        }
      });
    })
  }

  uploadToS3(body={}, name) {
    console.log(body, name)
    if (!isPlainObject(body) || typeof name !=='string') {
      return Promise.reject("Invalid params sent to upload to S3");
    }
    let s3 = new aws.S3()

    console.log('Trying to upload to s3', body, name)
    return s3.putObject({
      Body: Buffer.from(JSON.stringify(body)),
      Bucket: process.env.EMAIL_BUCKET,
      Key: `${name}.json`
    }).promise();
  }
}

module.exports.post = (event, context, callback) => {
  console.log(event);
  let body = event && event['body'];
  let params = isPlainObject(body) ? body : qs.parse(body);
  let service = new Service();

  let name = params.name && params.name.split(/ '-/).join('') + '-' + new Date().getTime();

  const dynamoParams = {
    TableName: "dynamo-table-name",

    Item: {
      name: params.name,
      country: params.country,
      email: params._replyto,
      phone: params.phone,
      message: params.message,
      createdAt: new Date().getTime()
    }
  }

  let toSend = [
    { email: params._replyto, applicant: true },
    { email: 'admin@fullstackapprenticeship.com' },
    { email: 'support@fullstackapprenticeship.com' }
  ].map((email, i) =>
    service.prepEmail(params, email.email, email.applicant ));

    console.log('Using Params: ', params);

    service.uploadToS3(params, name)
      .then(done => {
        console.log('Sending emails');
        return service.sendEmailBatch(toSend);
      }).then(async (sent) => {
        console.log('Success', sent)
        await dynamoDbLib.call("put", dynamoParams);
        callback(null, formatRedirectSuccess(params.Item));
      })
      .catch(err => {
        console.log('ERROR - ', err);
        return callback(formatErrorHelper(err.message));
      })
};

module.exports.redirect = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    /*
     * Based on the value of the CloudFront-Viewer-Country header, generate an
     * HTTP status code 302 (Redirect) response, and return a country-specific
     * URL in the Location header.
     * TODO: 1. You must configure your distribution to cache based on the
     *          CloudFront-Viewer-Country header. For more information, see
     *          http://docs.aws.amazon.com/console/cloudfront/cache-on-selected-headers
     *       2. CloudFront adds the CloudFront-Viewer-Country header after the viewer
     *          request event. To use this example, you must create a trigger for the
     *          origin request event.
     */

    let url;
    if (headers['cloudfront-viewer-country']) {
        const countryCode = headers['cloudfront-viewer-country'][0].value;
        if (countryCode === 'US') {
            url = 'https://fullstackapprenticeship.com/';
        } else if (countryCode === 'TT') {
            url = 'https://tt.fullstackapprenticeship.com/';
        }
    }

    const response = {
        status: '302',
        statusDescription: 'Found',
        headers: {
            location: [{
                key: 'Location',
                value: url,
            }],
        },
    };
    callback(null, response);
};

const formatSuccessHelper = (response) => {
  return {
    "statusCode": 200,
    "body": response
  }
}

const formatRedirectSuccess = (sent) => {
  console.log('redirecting: ', sent)
  return {
    statusCode: 302,
    body: "",
    headers: {
      "Location": "https://fullstackapprenticeship.com/resources.html"
    }
  }
}

const formatErrorHelper = (response) => {
  return {
    "statusCode": 500,
    "body": response
  }
}
