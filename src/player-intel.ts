import hivemind from '@/hivemind';
import { getRoomIntel } from '@/room-intel';
import _ from 'lodash';

export interface CreepIntel {
  body: Partial<Record<BodyPartConstant, number>>
  boosts?: Partial<Record<ResourceConstant, number>>
  pos: {
    x: number
    y: number
    roomName: string
  }
  lastSeen: number
  expires: number
};

export interface PlayerIntelMemory {
  lastSeen: number
  creeps: Record<Id<Creep>, CreepIntel>
  rooms: Record<string, number>
  remotes: Record<string, number>
  lastCleanup?: number
}

const CLEANUP_INTERVAL = 120;

export class PlayerIntel {
  protected memory: PlayerIntelMemory;
  protected readonly memoryKey: string;

  constructor(readonly userName: string) {
    this.memoryKey = `u-intel:${userName}`;
    if (!this.hasMemory()) {
      this.setMemory({
        lastSeen: Game.time,
        creeps: {},
        rooms: {},
        remotes: {},
      });
    }

    this.memory = this.getMemory();

    this.cleanupMemory();
  }

  hasMemory() {
    return hivemind.segmentMemory.has(this.memoryKey);
  }

  setMemory(memory: PlayerIntelMemory) {
    hivemind.segmentMemory.set(this.memoryKey, memory);
  }

  getMemory(): PlayerIntelMemory {
    return hivemind.segmentMemory.get(this.memoryKey);
  }

  cleanupMemory() {
    if (Game.time - (this.memory.lastCleanup || 0) < CLEANUP_INTERVAL) {
      return;
    }

    for (const roomName in this.memory.rooms) {
      const roomIntel = getRoomIntel(roomName);

      if (!roomIntel || roomIntel.getOwner() !== this.userName) {
        delete this.memory.rooms[roomName];
      }
    }

    for (const roomName in this.memory.remotes) {
      if (Game.time - this.memory.remotes[roomName] > CREEP_LIFE_TIME) {
        delete this.memory.remotes[roomName];
      }
    }

    for (const id in this.memory.creeps) {
      const creepIntel: CreepIntel = this.memory.creeps[id];

      // @todo Also delete creeps we can be sure have died. We could check
      // tombstones, for example.
      if (Game.time > creepIntel.expires) {
        delete this.memory.creeps[id];
      }
    }

    this.memory.lastCleanup = Game.time;
  }

  isNpc(): boolean {
    return this.userName === SYSTEM_USERNAME || this.userName === 'Invader' || this.userName === 'Source Keeper';
  }

  getAllOwnedRooms(): string[] {
    return _.keys(this.memory.rooms);
  }

  updateOwnedRoom(roomName: string) {
    this.memory.rooms[roomName] = Game.time;
  }

  getAllRemotes(): string[] {
    return _.keys(this.memory.remotes);
  }

  updateRemote(roomName: string) {
    this.memory.remotes[roomName] = Game.time;
  }

  updateCreeps(creeps: Creep[]) {
    if (!this.memory.creeps) {
      this.memory.creeps = {};
    }

    for (const creep of creeps) {
      // Only keep track of military creeps.
      if (!creep.isDangerous()) {
        continue;
      }

      if (!this.memory.creeps[creep.id]) {
        // Record some info about this creep.
        this.memory.creeps[creep.id] = {
          body: _.countBy(creep.body, 'type'),
          boosts: _.countBy(creep.body, 'boost'),
          pos: null,
          lastSeen: Game.time,
          expires: Game.time + (creep.ticksToLive ?? CREEP_LIFE_TIME),
        };
      }

      // Update some information.
      const creepIntel = this.memory.creeps[creep.id];

      creepIntel.lastSeen = Game.time;
      creepIntel.expires = Game.time + (creep.ticksToLive ?? CREEP_LIFE_TIME);

      const { x, y, roomName } = creep.pos;
      creepIntel.pos = { x, y, roomName };
    }
  }
}

export default PlayerIntel;
