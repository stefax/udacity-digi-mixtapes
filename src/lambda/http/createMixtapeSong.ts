import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { CreateMixtapeSongRequest } from '../../requests/CreateMixtapeSongRequest'
import { createLogger } from '../../utils/logger'
import { createSong } from "../../businessLogic/mixtapes";
import { getTokenFromAuthHeader } from "../../auth/utils";

const logger = createLogger('lambda:createMixtapeSong')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.debug('Processing event: ', event)

  const mixtapeSongRequest: CreateMixtapeSongRequest = JSON.parse(event.body)
  const mixtapeId = event.pathParameters.mixtapeId

  let body: string = ''
  let statusCode: number = 400

  try {
    const jwtToken = getTokenFromAuthHeader(event.headers.Authorization)
    const newSong = await createSong(mixtapeSongRequest, mixtapeId, jwtToken)
    statusCode = 201
    body = JSON.stringify({
      item: newSong
    })
  } catch (e) {
    logger.error('Song was not created (name empty or user does not have sufficient rights)', { error: e.message })
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
