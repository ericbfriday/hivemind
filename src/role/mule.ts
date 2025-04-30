import each from "lodash/each";
/* global FIND_RUINS FIND_DROPPED_RESOURCES FIND_TOMBSTONES
STRUCTURE_STORAGE STRUCTURE_TERMINAL FIND_SYMBOL_CONTAINERS */

import Role from "role/role";
import TradeRoute from "trade-route";

declare global {
  interface MuleCreep extends Creep {
    role: "mule";
    memory: MuleCreepMemory;
    heapMemory: MuleCreepHeapMemory;
  }

  interface MuleCreepMemory extends CreepMemory {
    delivering?: boolean;
    route: string;
    roomPath?: string[];
    pathIndex?: number;
    recordTravelLength?: number;
    suicideSpawn?: Id<StructureSpawn>;
  }

  interface MuleCreepHeapMemory extends CreepHeapMemory {
    demiseReported?: boolean;
  }
}

/**
 * Mules follow trade routes and transport resources accordingly.
 *
 * Memory structure:
 * - origin: Name of the room the creep originates in.
 * - route: Name of the trade route this mule works for.
 */
export default class MuleRole extends Role {
  tradeRoute: TradeRoute;

  /**
   * Makes this creep behave like a mule.
   *
   * @param {Creep} creep
   *   The creep to run logic for.
   */
  run(creep: MuleCreep) {
    // @todo Make TradeRoute object available and reusable.
    this.tradeRoute = new TradeRoute(creep.memory.route);

    if (creep.heapMemory.suicideSpawn) {
      this.performRecycle(creep);
      return;
    }

    this.reportEarlyDemise(creep);

    if (!this.tradeRoute.isActive()) {
      this.setDelivering(creep, false);
    }

    if (creep.memory.delivering) {
      this.deliverResources(creep);
      return;
    }

    this.pickupResources(creep);
  }

  reportEarlyDemise(creep: MuleCreep) {
    if (creep.ticksToLive > 10) return;
    if (creep.heapMemory.demiseReported) return;
    creep.heapMemory.demiseReported = true;

    const storageContents = [];
    each(creep.store, (amount, resourceType) => {
      if (amount === 0) return;
      storageContents.push(amount + " " + resourceType);
    });
    if (storageContents.length === 0) return;

    Game.notify(
      creep.name +
        " containing " +
        storageContents.join(", ") +
        " is about to expire in " +
        creep.pos.roomName +
        " on tick " +
        (Game.time + creep.ticksToLive),
    );
  }

  setDelivering(creep: MuleCreep, deliver: boolean) {
    creep.memory.delivering = deliver;
    const previousIndex = creep.memory.pathIndex;
    this.setRoomPath(
      creep,
      deliver ? this.tradeRoute.getPath() : this.tradeRoute.getReversePath(),
    );
    if (previousIndex)
      creep.memory.pathIndex = creep.memory.roomPath.length - previousIndex - 1;
  }

  setRoomPath(creep: MuleCreep, path: string[]) {
    creep.memory.roomPath = path;
    delete creep.memory.pathIndex;
  }

  followRoomPath(creep: MuleCreep) {
    if (!creep.memory.roomPath) {
      const targetRoom = creep.memory.delivering
        ? this.tradeRoute.getTarget()
        : this.tradeRoute.getOrigin();

      // @todo If for some reason the trade route has no room information,
      // look for a nearby room to move to and suicide.
      if (!targetRoom) return;

      const targetPosition = new RoomPosition(25, 25, targetRoom);
      creep.interRoomTravel(targetPosition);
      return;
    }

    // @todo Find room in path that we're closest to.
    if (!creep.memory.pathIndex) creep.memory.pathIndex = 0;

    const nextRoom = creep.memory.roomPath[creep.memory.pathIndex];
    if (!nextRoom) return;

    if (creep.pos.roomName === nextRoom && creep.isInRoom())
      creep.memory.pathIndex++;

    // Move to next room.
    const target = new RoomPosition(25, 25, nextRoom);
    if (creep.pos.getRangeTo(target) > 15) {
      creep.moveToRange(target, 15);
    }
  }

  /**
   * Makes the creep move into the target room and gather resources.
   *
   * @param {Creep} creep
   *   The creep to run logic for.
   */
  pickupResources(creep: MuleCreep) {
    const originRoom = this.tradeRoute.getOrigin();
    if (creep.pos.roomName !== originRoom) {
      // Move back to spawn room.
      this.followRoomPath(creep);
      return;
    }

    if (!this.tradeRoute.isActive()) {
      if (creep.store.getUsedCapacity() > 0) {
        // Choose a resource and deliver it.
        each(creep.store, (amount: number, resourceType: ResourceConstant) => {
          if (!amount || amount === 0) return null;

          const target = creep.room.getBestStorageTarget(amount, resourceType);
          if (!target) return false;

          creep.whenInRange(1, target, () => {
            creep.transfer(target, resourceType);
          });

          return false;
        });
        return;
      }

      // Wait for trade route to be active again.
      creep.moveToRange(new RoomPosition(25, 25, creep.room.name), 10);
      return;
    }

    // Switch to delivery mode if storage is full.
    if (creep.store.getFreeCapacity() === 0) {
      this.setDelivering(creep, true);
      if (!this.tradeRoute.hasTravelLength()) {
        creep.memory.recordTravelLength = Game.time;
      }

      return;
    }

    // Choose a target in the room.
    // @todo Cache it.
    const resourceType = this.tradeRoute.getResourceType();
    const target = creep.room.getBestStorageSource(resourceType);
    if (!target && !creep.memory.delivering) {
      if (creep.store.getUsedCapacity() * 2 > creep.store.getFreeCapacity()) {
        // Deliver what resources we gathered.
        this.setDelivering(creep, true);
        return;
      }

      // Wait for more.
      creep.moveToRange(new RoomPosition(25, 25, creep.room.name), 10);
      return;
    }

    if (!target) return;
    creep.whenInRange(1, target, () => {
      creep.withdraw(target, resourceType);
    });
  }

  /**
   * Makes the creep return to the spawn room and deliver resources.
   *
   * @param {Creep} creep
   *   The creep to run logic for.
   */
  deliverResources(creep: MuleCreep) {
    // @todo If delivering energy to one of our own rooms that doesn't have
    // a storage, use transporter logic to drop off the energy, or even
    // act as a temporary container until energy is used up.
    const targetRoom = this.tradeRoute.getTarget();
    if (creep.pos.roomName !== targetRoom) {
      // Move back to spawn room.
      // @todo Use reverse path from trade route.
      this.followRoomPath(creep);
      return;
    }

    if (creep.store.getUsedCapacity() === 0) {
      this.setDelivering(creep, false);

      // Suicide if another round is unlikely to succeed in time.
      const travelLength = this.tradeRoute.getTravelLength();
      if (travelLength && creep.ticksToLive < 2.1 * travelLength)
        this.performRecycle(creep);
      return;
    }

    // Choose a resource and deliver it.
    const resourceType = this.tradeRoute.getResourceType();
    const amount = creep.store[resourceType] || 0;

    const target = creep.room.getBestStorageTarget(amount, resourceType);
    if (!target) return;

    if (creep.pos.getRangeTo(target) > 1) {
      creep.goTo(target, { range: 1, maxRooms: 1 });
      return;
    }

    creep.transfer(target, resourceType);
    Game.notify(
      creep.memory.route +
        ": Transferred " +
        (creep.store[resourceType] || 0) +
        " " +
        resourceType +
        " to " +
        creep.room.name,
    );

    if (creep.memory.recordTravelLength) {
      this.tradeRoute.setTravelLength(
        Game.time - creep.memory.recordTravelLength,
      );
      delete creep.memory.recordTravelLength;
    }
  }
}
