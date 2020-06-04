/**
 * Interface representing a SigningKey
 */
export interface SigningKey {
  kid: string,
  nbf: string,
  publicKey: string
}
