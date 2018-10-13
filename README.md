# Serverless Email Form-Fill

You need to throw up a landing page, but don't want to be bothered deploying a REST API just to handle email registrations. You want to be able to send your new users a follow-up email, and store their information in a DynamoDB table, for later use. You also want to send yourself an email whenever you get a sign-up, to keep appraised.

This service uses Postmark, which is an ultra-reliable email delivery platform with a generous developer plan of 100 emails a month. You can always use Amazon's Simple Mail Service (SMS), which I might update this repository to take advantage of later. Postmark has very solid email templating tools, for creating great experiences.

You will also need to create an AWS account, setup the Command-Line Interface on your machine to be able to properly use the Serverless Framework which deploys the Lambda functions we use.

Also included is CloudFront Country-Code Header redirection. If deploying your front-end budle through an S3 bucket, wrapped in a Cloudfront distribution, edit your distributions 'Behavior' to have 'Lambda @ Edge' initialize the lambda function right when the page is requested, to redirect users based on country codes. This is very useful for avoiding the wrath of GDPR regulations, as well as forwarding product pages/web pages based on country of origin.

Documentation will be updated, for sure.
