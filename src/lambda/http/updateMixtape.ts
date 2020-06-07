import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateMixtapeRequest } from '../../requests/UpdateMixtapeRequest'
import { createLogger } from "../../utils/logger";
import { getTokenFromAuthHeader } from "../../auth/utils";
import { updateMixtape } from "../../businessLogic/mixtapes";

const logger = createLogger('lambda:updateMixtape')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)

  const mixtapeId = decodeURI(event.pathParameters.mixtapeId)
  const jwtToken = getTokenFromAuthHeader(event.headers.Authorization)
  const updatedMixtape: UpdateMixtapeRequest = JSON.parse(event.body)

  let statusCode: number = 403
  try {
    await updateMixtape(updatedMixtape, mixtapeId, jwtToken)
    statusCode = 204
  } catch (e) {
    logger.error('Mixtape was not updated (it does not exist or you do not have sufficient rights)', { error: e.message })
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
