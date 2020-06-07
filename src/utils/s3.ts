import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
// const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

const bucketName = process.env.S3_BUCKET_MIXTAPE_SONGS
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION)

export async function getUploadUrl(songId: string): Promise<string> {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: songId,
    Expires: urlExpiration
  })
}

export async function fileExists(songId: string): Promise<boolean> {
  try {
    await s3.headObject({
      Bucket: bucketName,
      Key: songId
    }).promise();
    return true
  } catch (headErr) {
    return headErr.code === 'NotFound'
  }
}

export async function removeFile(songId: string): Promise<void> {
  await s3.deleteObject({
    Bucket: bucketName,
    Key: songId
  })
}
