export interface MixtapeSong {
  creatorUserId: string
  mixtapeId: string
  songId: string
  type: string
  name: string
  createdAt: string
  songUrl?: string
  // the following need to be in the DynamoDB table, but are not required here as they are generated in the functions
  // mixtapeIdSongId: string
  // mixtapeIdTypeSongCreatedAt: string
  // typeMixtapeCreatedAtSongCreatedAt: string
}
