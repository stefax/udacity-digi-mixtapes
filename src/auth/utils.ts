import { decode } from 'jsonwebtoken'
import { JwtPayload } from './JwtPayload'
import Axios from "axios";
import {SigningKey} from "./SigningKey";

/**
 * Parse a JWT token and return a user id
 *
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
export function parseUserIdFromJwtToken(jwtToken: string): string {
  const decodedJwt = decode(jwtToken) as JwtPayload
  return decodedJwt.sub
}

/**
 * Extracts the token part of the auth header (e.g. 123 from header "Authorization: Bearer 123") and throws errors when
 * format is incorrect.
 *
 * @param authHeader E.g. Bearer 123
 * @returns The token, e.g. 123
 */
export function getTokenFromAuthHeader(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')

  return split[1]
}

/**
 * Extracts a signing key from the JSON Web Key Set (JWKS) URL from auth0.
 *
 * @param jwkurl The JSON Web Key Set URL obtained from Advanced Settings - Endpoints
 * @param kid The identifier for the key that was used to sign the JWT
 */
export const getSigningKeyFromJWKSUrl = async (jwkurl, kid): Promise<SigningKey> => {
  let res = await Axios.get(jwkurl, {
    headers: {
      'Content-Type': 'application/json',
      "Access-Control-Allow-Origin": "*",
      'Access-Control-Allow-Credentials': true,
    }
  });
  let keys  = res.data.keys;
  // since the keys is an array its possible to have many keys in case of cycling.
  const signingKeys = keys.filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signing
    && key.kty === 'RSA' // We are only supporting RSA
    && key.kid           // The `kid` must be present to be useful for later
    && key.x5c && key.x5c.length // Has useful public keys (we aren't using n or e)
  ).map(key => {
    return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
  });
  const signingKey = signingKeys.find(key => key.kid === kid);
  if (!signingKey){
    throw new Error('Invalid signing keys')
    // logger.error("No signing keys found") // <= TODO
  }
  // logger.info("Signing keys created successfully ", signingKey) // <= TODO
  return signingKey
};

// see https://github.com/sgmeyer/auth0-node-jwks-rs256/blob/master/src/lib/utils.js
function certToPEM(cert) {
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
  return cert;
}