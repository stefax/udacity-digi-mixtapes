import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify, decode } from 'jsonwebtoken'

import { createLogger } from '../../utils/logger'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'
import {getSigningKeyFromJWKSUrl, getTokenFromAuthHeader} from "../../auth/utils";

const logger = createLogger('auth')
const jwksUrl = process.env.JWKS_URL

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyAndDecodeToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyAndDecodeToken(authHeader: string): Promise<JwtPayload> {
  const token = getTokenFromAuthHeader(authHeader) // gets the 123 from Bearer 123

  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  const key = await getSigningKeyFromJWKSUrl(jwksUrl, jwt.header.kid)

  return verify(token, key.publicKey, { algorithms: ['RS256'] }) as JwtPayload
}