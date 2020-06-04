import * as AWS  from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import { createLogger } from "../utils/logger";

// why using require? see https://stackoverflow.com/questions/60207668/error-when-creating-a-dynamodb-document-client-aws-serverless-using-aws-xray-sdk
const AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('dynamodb')

/**
 * @return Creates either a local or a remote DocumentClient instance, depending on the IS_OFFLINE environment variable
 */
export function createDynamoDBClient(): DocumentClient {
  if (process.env.IS_OFFLINE) {
    logger.info('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}