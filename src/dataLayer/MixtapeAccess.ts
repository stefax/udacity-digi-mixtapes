import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as uuid from 'uuid'

import { Mixtape } from '../models/Mixtape'
import { MixtapeUpdate } from '../models/MixtapeUpdate'
import { createDynamoDBClient } from "./utils";
import { CreateMixtapeRequest } from "../requests/CreateMixtapeRequest";
import { UpdateMixtapeRequest } from "../requests/UpdateMixtapeRequest";
import { createLogger } from "../utils/logger";

const logger = createLogger('dynamodb:mixtape-access')

export class MixtapeAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly mixtapesTable: string = process.env.DYNAMO_DB_TABLE_MIXTAPE,
    private readonly typeMixtapeSongIndex: string = process.env.DYNAMO_DB_INDEX_TYPE_MIXTAPE_SONG) {
  }

  getTypeForMixtape(): string {
    return 'MR' // stands for mixtape record
  }

  generateMixtapeId(): string {
    return `${this.getTypeForMixtape()}|${uuid.v4()}`
  }

  getMixtapeIdSongId(mixtapeId: string, songId?: string): string {
    return `${mixtapeId}|${songId || ''}`;
  }

  getMixtapeIdTypeSongCreatedAt(mixtapeId: string, type: string, songCreatedAt?: string): string {
    return `${mixtapeId}|${type}|${songCreatedAt || ''}`;
  }

  getTypeMixtapeCreatedAtSongCreatedAt(type: string, mixtapeCreatedAt: string, songCreatedAt?: string): string {
    return `${type}|${mixtapeCreatedAt}|${songCreatedAt || ''}`;
  }

  /**
   * Get all mixtapes for the logged-in user sorted by createdAt from latest to oldest.
   */
  async getMixtapes(userId: string): Promise<Mixtape[]> {
    logger.debug('Get all mixtapes for the logged-in user sorted by createdAt from latest to oldest.')

    const result = await this.docClient
      .query({
        TableName: this.mixtapesTable,
        IndexName: this.typeMixtapeSongIndex,
        KeyConditionExpression: 'creatorUserId = :userId and begins_with(typeMixtapeCreatedAtSongCreatedAt, :type)',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':type': this.getTypeForMixtape()
        },
        ScanIndexForward: false
      })
      .promise()

    const items = result.Items

    return items as Mixtape[]
  }

  /**
   * Get a mixtape by id, throw error when logged in user is not owner.
   */
  async getMixtapeIfOwner(mixtapeId: string, userId: string): Promise<Mixtape> {
    logger.debug('Get a mixtape by id, throw error when logged in user is not owner.')

    const result = await this.docClient.get({
      TableName: this.mixtapesTable,
      Key: {
        mixtapeIdSongId: this.getMixtapeIdSongId(mixtapeId),
        creatorUserId: userId
      }
    }).promise()

    if (result.Item.creatorUserId !== userId) {
      throw new Error('Users can only get their own mixtapes.')
    }

    return result.Item as Mixtape;
  }

  /**
   * Check whether a user owns a mixtape and can therefore e.g. delete, update, etc.
   */
  async isUserOwnerOfMixtape(mixtapeId: string, userId: string): Promise<boolean> {
    try {
      await this.getMixtapeIfOwner(mixtapeId, userId)

      return true
    } catch (e) {

      return false
    }
  }

  /**
   * Create a new mixtape for the logged in user.
   */
  async createMixtape(mixtape: CreateMixtapeRequest, creatorUserId: string): Promise<Mixtape> {
    logger.debug('Create a new mixtape for the logged in user.')

    if (!mixtape.name) {
      throw new Error('A name is required.')
    }

    const mixtapeId = this.generateMixtapeId()
    const createdAt = new Date().toISOString()
    const type = this.getTypeForMixtape()
    const newMixtape = {
      ...mixtape,
      creatorUserId,
      mixtapeId,
      type,
      createdAt,
      mixtapeIdSongId: this.getMixtapeIdSongId(mixtapeId),
      mixtapeIdTypeSongCreatedAt: this.getMixtapeIdTypeSongCreatedAt(mixtapeId, type),
      typeMixtapeCreatedAtSongCreatedAt: this.getTypeMixtapeCreatedAtSongCreatedAt(type, createdAt)
    }

    await this.docClient.put({
      TableName: this.mixtapesTable,
      Item: newMixtape,
    }).promise()

    return newMixtape
  }

  /**
   * Update a mixtape if it belongs to the logged in user.
   */
  async updateMixtapeIfOwner(mixtape: UpdateMixtapeRequest, mixtapeId: string, updatingUserId: string): Promise<MixtapeUpdate> {
    logger.debug('Update a mixtape if it belongs to the logged in user.')
    // first check whether it's the logged-in user's mixtape by trying to get it
    await this.getMixtapeIfOwner(mixtapeId, updatingUserId);

    await this.docClient.update({
      TableName: this.mixtapesTable,
      Key: {
        mixtapeIdSongId: this.getMixtapeIdSongId(mixtapeId),
        creatorUserId: updatingUserId
      },
      UpdateExpression: 'set #name = :name',
      ExpressionAttributeValues: {
        ':name': mixtape.name
      },
      ExpressionAttributeNames: {
        '#name': 'name' // we cannot use it directly in the update expression as "name" is a reserved keyword
      }
    }).promise()

    return mixtape
  }

  /**
   * Delete a mixtape if it belongs to the logged in user.
   */
  async deleteMixtapeIfOwner(mixtapeId: string, deletingUserId: string): Promise<void> {
    logger.debug('Delete a mixtape and all its songs if it belongs to the logged in user.')

    await this.docClient.delete({
      TableName: this.mixtapesTable,
      Key: {
        mixtapeIdSongId: this.getMixtapeIdSongId(mixtapeId),
        creatorUserId: deletingUserId
      }
    }).promise()
  }
}