import filter from "lodash/filter";
import Process from "process/process";

declare global {
  interface RoomMemory {
    roleplay?: {
      roomSong?: SongMemory;
    };
  }
}

export type SongName = "harder";

export type SongMemory = {
  name: SongName;
  currentBeat: number;
};

// @todo Move memory to heap, it doesn't need to be persisted.
// @todo Song for defense: Still alive
// @todo Song for attack: Seven nation army

/* eslint-disable array-element-newline */
const songs = {
  harder: {
    roles: ["harvester", "transporter", "upgrader", "builder", "hauler"],
    lines: [
      // 2 x 2 nothing
      "work it",
      "",
      "make it",
      "",
      "do it",
      "",
      "makes us",
      "",
      "♪",
      "♪",
      "♪",
      "♬",
      "♪",
      "♪",
      "♪",
      "♬",
      "",
      "harder",
      "",
      "better",
      "",
      "faster",
      "",
      "stronger",
      "♪",
      "♪",
      "♪",
      "♬",
      "♪",
      "♪",
      "♪",
      "♬",
      "more than",
      "",
      "hour",
      "",
      "hour",
      "",
      "never",
      "",
      "♪",
      "♪",
      "♪",
      "♬",
      "♪",
      "♪",
      "♪",
      "♬",
      "",
      "ever",
      "",
      "after",
      "",
      "work is",
      "",
      "over",
      "♪",
      "♪",
      "♪",
      "♬",
      "♪",
      "♪",
      "♪",
      "♬",
      "work it",
      "",
      "make it",
      "",
      "do it",
      "",
      "makes us",
      "",
      "♪",
      "♪",
      "♪",
      "♬",
      "♪",
      "♪",
      "♪",
      "♬",
      "",
      "harder",
      "",
      "better",
      "",
      "faster",
      "",
      "stronger",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "work it",
      "harder",
      "make it",
      "better",
      "do it",
      "faster",
      "makes us",
      "stronger",
      "♪",
      "♪",
      "♪",
      "♬",
      "♪",
      "♪",
      "♪",
      "♬",
      "more than",
      "ever",
      "hour",
      "after",
      "hour",
      "work is",
      "never",
      "over",
      "♪",
      "♪",
      "♪",
      "♬",
      "♪",
      "♪",
      "♪",
      "♬",
      "work it",
      "harder",
      "make it",
      "better",
      "do it",
      "faster",
      "makes us",
      "stronger",
      "more than",
      "ever",
      "hour",
      "after",
      "hour",
      "work is",
      "never",
      "over",
      "work it",
      "harder",
      "make it",
      "better",
      "do it",
      "faster",
      "makes us",
      "stronger",
      "more than",
      "ever",
      "hour",
      "after",
      "hour",
      "work is",
      "never",
      "over",
      "work it",
      "harder",
      "make it",
      "better",
      "do it",
      "faster",
      "makes us",
      "stronger",
      "more than",
      "ever",
      "hour",
      "after",
      "hour",
      "work is",
      "never",
      "over",
      "work it",
      "harder",
      "make it",
      "better",
      "do it",
      "faster",
      "makes us",
      "stronger",
      "more than",
      "ever",
      "hour",
      "after",
      "hour",
      "work is",
      "never",
      "over",
      "work it",
      "harder",
      "make it",
      "better",
      "do it",
      "faster",
      "makes us",
      "stronger",
      "more than",
      "ever",
      "hour",
      "after",
      "hour",
      "work is",
      "never",
      "over",
      "work it",
      "harder",
      "make it",
      "better",
      "do it",
      "faster",
      "makes us",
      "stronger",
      "more than",
      "ever",
      "hour",
      "after",
      "hour",
      "work is",
      "never",
      "over",
      // Drums
      // Drums
      "work it",
      "harder",
      "make it",
      "better",
      "do it",
      "faster",
      "makes us",
      "stronger",
      "more than",
      "ever",
      "hour",
      "after",
      "hour",
      "work is",
      "never",
      "over",
      "work it",
      "harder",
      "make it",
      "better",
      "do it",
      "faster",
      "makes us",
      "stronger",
      "more than",
      "ever",
      "hour",
      "after",
      "hour",
      "work is",
      "never",
      "over",
      "work it",
      "harder",
      "make it",
      "better",
      "do it",
      "faster",
      "makes us",
      "stronger",
      "more than",
      "ever",
      "hour",
      "after",
      "hour",
      "work is",
      "never",
      "over",
      "work it",
      "harder",
      "make it",
      "better",
      "do it",
      "faster",
      "makes us",
      "stronger",
      "more than",
      "ever",
      "hour",
      "after",
      "hour",
      "work is",
      "never",
      "over",
      "work it",
      "harder",
      "make it",
      "better",
      "do it",
      "faster",
      "makes us",
      "stronger",
      "more than",
      "ever",
      "hour",
      "after",
      "hour",
      "work is",
      "never",
      "over",
      "work it",
      "harder",
      "",
      "",
      "do it",
      "faster",
      "",
      "",
      "more than",
      "ever",
      "",
      "",
      "our",
      "work is",
      "never",
      "over",
      "work it",
      "harder",
      "make it",
      "better",
      "do it",
      "faster",
      "makes us",
      "stronger",
      "more than",
      "ever",
      "hour",
      "after",
      "hour",
      "work is",
      "never",
      "over",
    ],
  },
};
/* eslint-enable array-element-newline */

export default class RoomSongsProcess extends Process {
  room: Room;
  memory: SongMemory;

  /**
   * Makes creeps sing songs.
   * @constructor
   *
   * @param {object} parameters
   *   Options on how to run this process.
   */
  constructor(parameters: RoomProcessParameters) {
    super(parameters);
    this.room = parameters.room;

    // Initialize memory.
    if (!this.room.memory.roleplay) this.room.memory.roleplay = {};
    if (!this.room.memory.roleplay.roomSong) {
      this.room.memory.roleplay.roomSong = {
        name: "harder",
        currentBeat: 0,
      };
    }
    this.memory = this.room.memory.roleplay.roomSong;
  }

  /**
   * Sings a song in our room.
   */
  run() {
    // @todo Choose from multiple songs.
    if (!this.memory.name) this.memory.name = "harder";
    if (!songs[this.memory.name]) return;
    const song = songs[this.memory.name];

    // Increment beat.
    if (!this.memory.currentBeat) this.memory.currentBeat = 0;
    this.memory.currentBeat++;
    if (this.memory.currentBeat >= song.lines.length)
      this.memory.currentBeat = 0;

    if (
      !song.lines[this.memory.currentBeat] ||
      song.lines[this.memory.currentBeat] === ""
    )
      return;

    const creeps = filter(this.room.creeps, (creep: Creep) =>
      song.roles.includes(creep.memory.role),
    );
    if (creeps.length <= 0) return;

    const creep = creeps[Math.floor(Math.random() * creeps.length)];
    creep.say(song.lines[this.memory.currentBeat], true);
  }
}
