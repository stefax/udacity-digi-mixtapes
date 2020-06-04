# 1 About Digi Mixtapes

## 1.1 Purpose 
This project is an exercise for a serverless application. It is the backend part of an app that allows a logged-in user to create "mixtapes", collections of songs.

## 1.2 Technology
The project is configured with the [Serverless Framework](https://www.serverless.com/), a framework that allows to create resources for and deploy code to different cloud providers. For Digi Mixtapes AWS is used.
 
**Used services**
- [AWS Lambda](https://aws.amazon.com/de/lambda/) to run the code without thinking about (provisioning or managing) servers
- [Amazon S3](https://aws.amazon.com/s3/) to easily store and access files (the mixtape songs) 
- [Amazon DynamoDB](https://aws.amazon.com/de/dynamodb/) as easily scalable cloud-native NoSQL database
- [Amazon API Gateway](https://aws.amazon.com/de/api-gateway/) to allow access to the app through a REST API
- [Auth0](https://auth0.com/) as identity provider to allow for users to authenticate with the app


# 2 Functionality

This repository contains the backend part of the application.

## 2.1 Core
- Users need to login to use the app 
- Users can create, update & remove mixtapes
- Removing a mixtape removes all songs within it  
- Within a mixtape they can add songs to the end or remove songs
- Users only have access to their own mixtapes & songs 

## 2.2 REST API

### Mixtapes
- `GET /mixtapes` List all your mixtapes
- `POST /mixtapes` Create a new mixtape
- `PATCH /mixtapes/<mixtape-id>` Update a mixtape by id (e.g. the name)
- `DELETE /mixtapes/<mixtape-id>` Delete a mixtape by id

### Songs
- `GET /mixtapes/<mixtape-id>/songs` List all songs for a mixtape
- `POST /mixtapes/<mixtape-id>/songs` Create and add a song to a mixtape
- `PATCH /mixtapes/<mixtape-id>/songs/<song-id>` Update a song by id (e.g. the name)
- `DELETE /mixtapes/<mixtape-id>/songs/<song-id>` Delete a song by id

## 2.3 Testing
As there is no front-end implementation in this repository, the API can be tested with [Postman](https://www.postman.com/downloads/). 

The Postman collection contains sample requests for all relevant API calls. There are two collection variables defined:
- **baseUrl**: `https://<api-id>.execute-api.<region>.amazonaws.com/dev/` - already set for the currently deployed app on AWS
- **authToken**: the JWT token required for all API calls - already set with a valid token for an example client; for obtaining a new JWT token, see 2.3.1

### 2.3.1 Obtaining New JWT Token
Postman allows for using OAuth2 authorization with identity providers. The Digi Mixtapes app uses Auth0. A JWT token can be obtained through authenticating with Auth0 as follows:




# 3 Installing & Running The App

## 3.1 Prerequisites

- Serverless is installed (check with `serverless version` or short `sls version`)
- Node.js & npm are installed (check with `node -v` and `npm -v`)
- Sufficient rights to an AWS account and to the AWS Management Console

## 3.2 Commands

### Configure IAM User

In order for Serverless Framework to deploy, set up a user in [IAM](https://aws.amazon.com/iam/) with sufficient rights, named e.g. "serverless" and save the access key and secret key. Then run the following command to configure the user for Serverless Framework:

```
sls config credentials --provider aws --key <key> --secret <secret> --profile serverless
```

*This creates user & credentials in your home directory ~/.aws/credentials and ~/.aws/config*

### Installation

To install the app on AWS, run the following commands from the base directory:

```
npm install
sls deploy -v
```

If the serverless command fails because of the wrong user, provide the profile explicitly:
 
```
sls deploy -v --aws-profile serverless
```

### Update

To update the app, run the same command:

```
sls deploy -v
```

### Removing

To remove all functions, resources (DynamoDB tables, S3 buckets), roles, etc., run the following command:  

```
sls remove -v
```

*Serverless Framework doesn't create the services directly in AWS but creates a [CloudFormation](https://aws.amazon.com/cloudformation/) template. From this template a CloudFormation stack is created and this contains all the services. So, if anything goes wrong, you can always still go into the AWS Management Console and check the related CloudFormation stack.*