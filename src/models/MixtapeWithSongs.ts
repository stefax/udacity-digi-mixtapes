import {Mixtape} from "./Mixtape";
import {MixtapeSong} from "./MixtapeSong";

export interface MixtapeWithSongs {
  mixtape: Mixtape,
  mixtapeSongs: MixtapeSong[]
}
