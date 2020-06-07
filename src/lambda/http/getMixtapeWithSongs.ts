import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { createLogger } from "../../utils/logger";
import { getMixtapeWithSongs } from "../../businessLogic/mixtapes";
import { getTokenFromAuthHeader } from "../../auth/utils";

const logger = createLogger('lambda:getMixtapeWithSongs')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)

  const mixtapeId = decodeURI(event.pathParameters.mixtapeId)
  const jwtToken = getTokenFromAuthHeader(event.headers.Authorization)

  const mixtapeWithSongs = await getMixtapeWithSongs(mixtapeId, jwtToken)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(mixtapeWithSongs)
  }
}
