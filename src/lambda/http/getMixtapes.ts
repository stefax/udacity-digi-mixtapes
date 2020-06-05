import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { createLogger } from "../../utils/logger";
import { getMixtapes } from "../../businessLogic/mixtapes";
import { getTokenFromAuthHeader } from "../../auth/utils";

const logger = createLogger('lambda:getMixtapes')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)

  const jwtToken = getTokenFromAuthHeader(event.headers.Authorization)

  const mixtapes = await getMixtapes(jwtToken)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      items: mixtapes
    })
  }
}
