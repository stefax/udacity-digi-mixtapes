import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { CreateMixtapeRequest } from '../../requests/CreateMixtapeRequest'
import { createLogger } from '../../utils/logger'
import { createMixtape } from "../../businessLogic/mixtapes";
import { getTokenFromAuthHeader } from "../../auth/utils";

const logger = createLogger('lambda:createMixtape')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)

  const mixtapeRequest: CreateMixtapeRequest = JSON.parse(event.body)

  let body: string = ''
  let statusCode: number = 400

  try {
    const jwtToken = getTokenFromAuthHeader(event.headers.Authorization)
    const newMixtape = await createMixtape(mixtapeRequest, jwtToken)
    statusCode = 201
    body = JSON.stringify({
      item: newMixtape
    })
  } catch (e) {
    logger.error('Mixtape item was not created (name empty or user does not have sufficient rights)', { error: e.message })
  }

  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body
  }
}
