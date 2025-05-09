import each from "lodash/each";
import filter from "lodash/filter";
import size from "lodash/size";
import max from "lodash/max";
import container from "utils/container";
import Process from "process/process";
import hivemind from "hivemind";
import RoomStatus from "room/room-status";

export default class SpawnPowerCreepsProcess extends Process {
  roomStatus: RoomStatus;

  constructor(parameters: ProcessParameters) {
    super(parameters);

    this.roomStatus = container.get("RoomStatus");
  }

  /**
   * Spawns power creeps in their assigned rooms.
   */
  run() {
    each(Game.powerCreeps, (creep) => {
      if (!creep.memory.role) creep.memory.role = "operator";

      if (creep.shard) return;
      if (creep.spawnCooldownTime && creep.spawnCooldownTime > Date.now())
        return;

      this.assignPowerCreep(creep);
      if (!creep.memory.singleRoom) return;

      const room = Game.rooms[creep.memory.singleRoom];
      if (!room || !room.powerSpawn) return;

      hivemind
        .log("creeps", room.name)
        .notify("⟳ Respawned power creep " + creep.name + " in " + room.name);
      creep.spawn(room.powerSpawn);
    });
  }

  /**
   * Assigns power creep to best room without a power creep.
   *
   * @todo This gets more complicated once factories are involved.
   *
   * @param {PowerCreep} creep
   *   The power creep that needs to be assigned a room.
   */
  assignPowerCreep(creep: PowerCreep) {
    const roomsWithoutPC = filter(Game.myRooms, (room) => {
      if (!room.powerSpawn) return false;

      if (size(room.powerCreeps) > 0) return false;

      return true;
    });

    const bestRoom = max(roomsWithoutPC, (room) => {
      return this.roomStatus.getExpansionScore(room.name) || 0;
    });

    if (!bestRoom) return;

    creep.memory.singleRoom = bestRoom.name;
  }
}
