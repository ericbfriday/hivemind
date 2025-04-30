import Process from "process/process";

export default class RoomManagerProcess extends Process {
  room: Room;

  /**
   * Manages structures in owned rooms.
   * @constructor
   *
   * @param {object} parameters
   *   Options on how to run this process.
   */
  constructor(parameters: RoomProcessParameters) {
    super(parameters);
    this.room = parameters.room;
  }

  /**
   * Manages structures in a given room.
   */
  run() {
    this.room.roomManager.runLogic();
  }
}
