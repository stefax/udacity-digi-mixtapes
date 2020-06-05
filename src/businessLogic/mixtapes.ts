import { Mixtape } from '../models/Mixtape'
import { MixtapeUpdate } from '../models/MixtapeUpdate'
import { MixtapeSong } from '../models/MixtapeSong'
import { MixtapeWithSongs } from '../models/MixtapeWithSongs'
import { CreateMixtapeRequest } from '../requests/CreateMixtapeRequest'
import { UpdateMixtapeRequest } from '../requests/UpdateMixtapeRequest'
import { CreateMixtapeSongRequest } from '../requests/CreateMixtapeSongRequest'
import { parseUserIdFromJwtToken } from '../auth/utils'
import { fileExists, getUploadUrl, removeFile } from "../utils/s3"
import { createLogger } from "../utils/logger"
import { MixtapeAccess } from "../dataLayer/MixtapeAccess"
import { MixtapeSongAccess } from "../dataLayer/MixtapeSongAccess"

const mixtapeAccess = new MixtapeAccess()
const mixtapeSongAccess = new MixtapeSongAccess()
const logger = createLogger('businessLogic:mixtapes')

export async function getMixtapes(jwtToken: string): Promise<Mixtape[]> {
  const userId = parseUserIdFromJwtToken(jwtToken)

  return mixtapeAccess.getMixtapes(userId)
}

export async function createMixtape(createMixtapeRequest: CreateMixtapeRequest, jwtToken: string): Promise<Mixtape> {
  const userId = parseUserIdFromJwtToken(jwtToken)

  return await mixtapeAccess.createMixtape(createMixtapeRequest, userId)
}

export async function updateMixtape(updateMixtapeRequest: UpdateMixtapeRequest, mixtapeId: string, jwtToken: string): Promise<MixtapeUpdate> {
  const userId = parseUserIdFromJwtToken(jwtToken)

  return await mixtapeAccess.updateMixtapeIfOwner(updateMixtapeRequest, mixtapeId, userId)
}

export async function deleteMixtape(mixtapeId: string, jwtToken: string): Promise<void> {
  const userId = parseUserIdFromJwtToken(jwtToken)

  // first loop through all songs ...
  const mixtapeWithSongs = await mixtapeSongAccess.getMixtapeWithSongs(userId, mixtapeId)

  // ... delete all songs (files and table entries)
  for (let song of mixtapeWithSongs.mixtapeSongs) {
    await deleteSong(mixtapeId, song.songId, jwtToken)
  }

  // ... finally delete the mixtape itself from the table.
  return await mixtapeAccess.deleteMixtapeIfOwner(mixtapeId, userId)
}

export async function getMixtapeWithSongs(mixtapeId: string, jwtToken: string): Promise<MixtapeWithSongs> {
  const userId = parseUserIdFromJwtToken(jwtToken)

  return mixtapeSongAccess.getMixtapeWithSongs(userId, mixtapeId)
}

export async function createSong(createMixtapeSongRequest: CreateMixtapeSongRequest, mixtapeId: string, jwtToken: string): Promise<MixtapeSong> {
  const userId = parseUserIdFromJwtToken(jwtToken)

  return await mixtapeSongAccess.createSong(createMixtapeSongRequest, mixtapeId, userId)
}

export async function generateSongUploadUrl(mixtapeId: string, songId: string, jwtToken: string): Promise<string> {
  const userId = parseUserIdFromJwtToken(jwtToken)

  if (await mixtapeAccess.isUserOwnerOfMixtape(mixtapeId, userId)) {
    return await getUploadUrl(songId)
  }
}

export async function deleteSong(mixtapeId: string, songId: string, jwtToken: string): Promise<void> {
  const userId = parseUserIdFromJwtToken(jwtToken)

  // delete song from s3 bucket if it exists
  if (await fileExists(songId)) {
    logger.info('Deleting related song for mixtape that will be removed.')
    await removeFile(songId)
  }

  // delete the songs from the table ...
  return await mixtapeSongAccess.deleteSongIfOwner(mixtapeId, songId, userId)
}
