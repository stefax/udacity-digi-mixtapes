import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { getTokenFromAuthHeader } from "../../auth/utils";
import { createLogger } from "../../utils/logger";
import { generateSongUploadUrl } from "../../businessLogic/mixtapes";

const logger = createLogger('lambda:generateSongUploadUrl')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)

  const mixtapeId = event.pathParameters.mixtapeId
  const songId = event.pathParameters.songId
  const jwtToken = getTokenFromAuthHeader(event.headers.Authorization)

  let statusCode: number = 403
  let body: string = ''
  try {
    const uploadUrl: string = await generateSongUploadUrl(mixtapeId, songId, jwtToken)
    statusCode = 200
    body = JSON.stringify({
      uploadUrl
    })
  } catch (e) {
    logger.error('Generating signed url failed.', { error: e.message })
  }

  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body
  }
}
