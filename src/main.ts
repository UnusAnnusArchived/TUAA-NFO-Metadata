import fs from "fs/promises";
import moment from "moment";
import axios from "axios";

// have to do this bc typescript is stupid
interface Exceptions {
  [key: string]: string;
}

const exceptions: Exceptions = {
  "s00.e003": "",
  "s00.e004": "Time is running out",
  "s00.e006": "An alternate cut of episode 257.",
  "s00.e014": "",
  "s00.e015": "",
  "s00.e016": "",
  "s00.e017": "Combination of s00.e015 and s00.e016.",
  "s01.e001": "*",
};

const genEpisodeId = (season: number, episode: number) => {
  return `s${season.toString().padStart(2, "0")}.e${episode.toString().padStart(3, "0")}`;
};

const genNFO = ({ title, description, season, episode, releasedate }: IMetadata) => {
  const episodeId = genEpisodeId(season, episode);

  const plot =
    exceptions[episodeId] !== undefined
      ? exceptions[episodeId] === "*"
        ? description
        : exceptions[episodeId]
      : description.split("<br>")[0];

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<episodedetails>
  <title>${title}</title>
  <plot>${plot}</plot>
  <thumb>./${episodeId}.jpg</thumb>
  <season>${season}</season>
  <episode>${episode}</episode>
  <premiered>${moment(releasedate).format("YYYY-MM-DD")}</premiered>
</episodedetails>`;
};

interface IMetadata {
  video: string;
  season: number;
  episode: number;
  title: string;
  description: string;
  releasedate: number;
  thumbnail: string;
}

(async () => {
  const req = await axios.get<IMetadata[][]>("https://unusann.us/api/v3/metadata/1/all");

  const metadata = req.data;

  for (let s = 0; s < metadata.length; s++) {
    const seasonPath = `metadata/${s === 0 ? "Specials" : `Season ${s}`}`;

    for (let e = 0; e < metadata[s].length; e++) {
      const episode = metadata[s][e];

      console.log(`Writing ${genEpisodeId(episode.season, episode.episode)}`);

      const path = `${seasonPath}/${genEpisodeId(episode.season, episode.episode)}.nfo`;

      await fs.writeFile(path, genNFO(episode));
    }
  }
})();
