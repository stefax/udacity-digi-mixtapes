import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as uuid from 'uuid'

import { Mixtape } from '../models/Mixtape'
import { MixtapeWithSongs } from "../models/MixtapeWithSongs"
import { createDynamoDBClient } from "./utils"
import { createLogger } from "../utils/logger"
import { MixtapeSong } from "../models/MixtapeSong"
import { MixtapeAccess } from "./MixtapeAccess"
import { CreateMixtapeSongRequest } from "../requests/CreateMixtapeSongRequest";

const logger = createLogger('dynamodb:mixtape-access')
const mixtapeAccess = new MixtapeAccess()

export class MixtapeSongAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly mixtapesTable: string = process.env.DYNAMO_DB_TABLE_MIXTAPE,
    private readonly mixtapeTypeSongIndex: string = process.env.DYNAMO_DB_INDEX_MIXTAPE_TYPE_SONG,
    private readonly mixtapeSongsBucket: string = process.env.S3_BUCKET_MIXTAPE_SONGS) {
  }

  getTypeForSong(): string {
    return 'SR' // stands for song record
  }

  generateSongId(): string {
    return `${this.getTypeForSong()}|${uuid.v4()}`
  }

  /**
   * Get mixtape details and all songs for the mixtape and logged-in user sorted by createdAt from latest to oldest.
   */
  async getMixtapeWithSongs(userId: string, mixtapeId: string): Promise<MixtapeWithSongs> {
    logger.debug('Get mixtape details and all songs for the mixtape and logged-in user sorted by createdAt from latest to oldest.')

    const result = await this.docClient
      .query({
        TableName: this.mixtapesTable,
        IndexName: this.mixtapeTypeSongIndex,
        KeyConditionExpression: 'creatorUserId = :userId AND mixtapeIdTypeSongCreatedAt BEGINS_WITH :mixtapeId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':mixtapeId': mixtapeId
        },
        ScanIndexForward: false
      })
      .promise()

    const items = result.Items

    return {
      mixtape: items.filter(item => item.type === mixtapeAccess.getTypeForMixtape())[0] as Mixtape,
      mixtapeSongs: items.filter(item => item.type === this.getTypeForSong()) as MixtapeSong[]
    }
  }

  /**
   * Create and add a new song to the end of the mixtape for the logged in user.
   */
  async createSong(song: CreateMixtapeSongRequest, mixtapeId: string, creatorUserId: string): Promise<MixtapeSong> {
    logger.debug('Create and add a new song to the end of the mixtape for the logged in user.')

    if (!song.name) {
      throw new Error('A name is required.')
    }

    const mixtape = await mixtapeAccess.getMixtapeIfOwner(mixtapeId, creatorUserId)
    const songId = this.generateSongId()
    const createdAt = new Date().toISOString()
    const type = this.getTypeForSong()
    const newMixtapeSong = {
      ...song,
      creatorUserId,
      mixtapeId,
      songId,
      type,
      createdAt,
      songUrl: `https://${this.mixtapeSongsBucket}.s3.amazonaws.com/${songId}`,
      mixtapeIdSongId: mixtapeAccess.getMixtapeIdSongId(mixtapeId, songId),
      mixtapeIdTypeSongCreatedAt: mixtapeAccess.getMixtapeIdTypeSongCreatedAt(mixtapeId, type, createdAt),
      typeMixtapeCreatedAtSongCreatedAt: mixtapeAccess.getTypeMixtapeCreatedAtSongCreatedAt(type, mixtape.createdAt, createdAt)
    }

    await this.docClient.put({
      TableName: this.mixtapesTable,
      Item: newMixtapeSong,
    }).promise()

    return newMixtapeSong
  }

  /**
   * Delete a song from a mixtape if it belongs to the logged in user.
   */
  async deleteSongIfOwner(mixtapeId: string, songId: string, deletingUserId: string): Promise<void> {
    logger.debug('Delete a song from a mixtape if it belongs to the logged in user.')

    await this.docClient.delete({
      TableName: this.mixtapesTable,
      Key: {
        mixtapeIdSongId: mixtapeAccess.getMixtapeIdSongId(mixtapeId, songId),
        creatorUserId: deletingUserId
      }
    }).promise()
  }
}
