import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { getTokenFromAuthHeader } from "../../auth/utils";
import { createLogger } from "../../utils/logger";
import { deleteSong } from "../../businessLogic/mixtapes";

const logger = createLogger('lambda:deleteMixtapeSong')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)

  const mixtapeId = event.pathParameters.mixtapeId
  const songId = event.pathParameters.songId
  const jwtToken = getTokenFromAuthHeader(event.headers.Authorization)

  let statusCode: number = 403

  try {
    await deleteSong(mixtapeId, songId, jwtToken)
    statusCode = 204
  } catch (e) {
    logger.error('Song was not deleted (it does not exist or user does not have sufficient rights).', { error: e.message })
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
