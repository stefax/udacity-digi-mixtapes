import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { getTokenFromAuthHeader } from "../../auth/utils";
import { createLogger } from "../../utils/logger";
import { deleteMixtape } from "../../businessLogic/mixtapes";

const logger = createLogger('lambda:deleteMixtape')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)

  const mixtapeId = decodeURI(event.pathParameters.mixtapeId)
  const jwtToken = getTokenFromAuthHeader(event.headers.Authorization)

  let statusCode: number = 403

  try {
    await deleteMixtape(mixtapeId, jwtToken)
    statusCode = 204
  } catch (e) {
    logger.error('Mixtape was not deleted (it does not exist or user does not have sufficient rights).', { error: e.message })
  }

  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: ''
  }
}
