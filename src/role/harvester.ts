/* global STRUCTURE_LINK RESOURCE_ENERGY LOOK_CREEPS
STRUCTURE_CONTAINER FIND_CONSTRUCTION_SITES LOOK_RESOURCES LOOK_STRUCTURES */

// @todo Rewrite delivery part using transporter logic.
// @todo Just make the harvester build a container when none is available.
// @todo Merge fixedMineralSource into fixedSource.
// @todo Stop harvesting when container and link are full.

import { deserializePosition, encodePosition, serializeCoords } from '@/utils/serialization';
import _ from 'lodash';
import Role from 'role/role';
import TransporterRole from 'role/transporter';

declare global {
  export interface HarvesterCreep extends Creep {
    memory: HarvesterCreepMemory
    heapMemory: HarvesterCreepHeapMemory
  }

  export interface HarvesterCreepMemory extends CreepMemory {
    role: 'harvester'
    harvesting?: boolean
    fixedSource?: Id<Source>
    fixedMineralSource?: Id<Mineral>
    harvestPos?: number
    noHarvestPos?: boolean
  }

  export interface HarvesterCreepHeapMemory extends CreepHeapMemory {
  }
}

export class HarvesterRole extends Role {
  transporterRole: TransporterRole;

  constructor() {
    super();

    // Harvesting energy is essential and doesn't need tons of CPU.
    this.stopAt = 0;
    this.throttleAt = 2000;

    this.transporterRole = new TransporterRole();
  }

  /**
   * Makes a creep behave like a harvester.
   *
   * @param {HarvesterCreep} creep
   *   The creep to run logic for.
   */
  run(creep: HarvesterCreep) {
    if (creep.heapMemory.suicideSpawn) {
      this.performRecycle(creep);
      return;
    }

    // @todo Instead of completely circumventing TypeScript, find a way to
    // make energy gathering reusable between multiple roles.
    this.transporterRole.creep = creep as unknown as TransporterCreep;

    if (this.hasFinishedDelivering(creep)) {
      this.setHarvesterState(creep, true);
    }
    else if (this.hasFinishedHarvesting(creep) && !this.isStationaryHarvester(creep)) {
      // Have harvester explicitly deliver resources, unless it's a fixed energy
      // harvester with no need to move.
      this.setHarvesterState(creep, false);
    }

    if (creep.memory.harvesting) {
      this.performHarvest(creep);
      return;
    }

    this.performHarvesterDeliver(creep);
  }

  hasFinishedDelivering(creep: HarvesterCreep) {
    return !creep.memory.harvesting && creep.store.getUsedCapacity() === 0;
  }

  hasFinishedHarvesting(creep: HarvesterCreep) {
    return creep.memory.harvesting && creep.store.getFreeCapacity() === 0;
  }

  isStationaryHarvester(creep: HarvesterCreep) {
    return (creep.memory.fixedSource || creep.memory.fixedMineralSource) && _.size(creep.room.creepsByRole.transporter) > 0;
  }

  /**
   * Determines where a harvester's fixed position should be.
   *
   * @param {HarvesterCreep} creep
   *   The creep to run logic for.
   * @param {Source | Mineral} source
   *   The source this harvester is assigned to.
   */
  determineHarvestPosition(creep: HarvesterCreep, source: Source | Mineral) {
    if (creep.memory.harvestPos || creep.memory.noHarvestPos) {
      return;
    }
    if (!creep.room.roomPlanner) {
      return;
    }

    // Get harvest position from room planner.
    const harvestPos = _.sample(creep.room.roomPlanner.getLocations(`harvester.${source.id}`));
    if (harvestPos) {
      creep.memory.harvestPos = serializeCoords(harvestPos.x, harvestPos.y);
    }

    if (!creep.memory.harvestPos) {
      creep.memory.noHarvestPos = true;
    }
  }

  /**
   * Puts this creep into or out of harvesting mode.
   *
   * @param {HarvesterCreep} creep
   *   The creep to run logic for.
   * @param {boolean} harvesting
   *   Whether this creep should be harvesting.
   */
  setHarvesterState(creep: HarvesterCreep, harvesting: boolean) {
    creep.memory.harvesting = harvesting;
    delete creep.memory.resourceTarget;
  }

  /**
   * Makes the creep gather resources in the current room.
   *
   * @param {HarvesterCreep} creep
   *   The creep to run logic for.
   */
  performHarvest(creep: HarvesterCreep) {
    let source: Source | Mineral;
    if (creep.memory.fixedSource) {
      source = Game.getObjectById(creep.memory.fixedSource)!;
      // @todo Just in case, handle source not existing anymore.
    }
    else if (creep.memory.fixedMineralSource) {
      source = Game.getObjectById(creep.memory.fixedMineralSource)!;
      const minAmount = 0;
      /* If (source && source.mineralType === RESOURCE_THORIUM && !creep.room.isStripmine()) {
				minAmount = creep.getActiveBodyparts(WORK) * 10;
			} */

      if (!source || source.mineralAmount <= minAmount) {
        // Return home and suicide.
        this.performRecycle(creep);
        return;
      }
    }

    this.determineHarvestPosition(creep, source!);

    // By default, just move to range 1 of the source.
    let targetPos = source!.pos;
    let targetRange = 1;

    // If available, move onto a harvest position.
    if (creep.memory.harvestPos) {
      const harvestPosition = deserializePosition(creep.memory.harvestPos, creep.room.name);
      if (harvestPosition!.lookFor(LOOK_CREEPS).length === 0) {
        targetPos = harvestPosition!;
        targetRange = 0;
      }
    }

    // Move to container when creep's store is almost full.
    const targetContainer = source!.getNearbyContainer();
    const harvestPower = (source! instanceof Source) ? HARVEST_POWER : HARVEST_MINERAL_POWER;
    if (
      targetContainer
      && targetContainer.pos.getRangeTo(targetPos) > 1
      && creep.store.getFreeCapacity() < creep.getActiveBodyparts(WORK) * harvestPower
    ) {
      targetPos = targetContainer.pos;
      targetRange = 1;
    }

    creep.whenInRange(targetRange, targetPos, () => {
      creep.harvest(source);

      // If there's a harvester bay, transfer resources into it.
      if (this.depositInBay(creep)) {
        return;
      }

      // If there's a link or container nearby, directly deposit resources.
      this.depositResources(creep, source);
    });
  }

  /**
   * Deposits energy in a harvester's bay.
   *
   * @param {HarvesterCreep} creep
   *   The creep to run logic for.
   *
   * @return {boolean}
   *   True if the harvester is in a bay.
   */
  depositInBay(creep: HarvesterCreep): boolean {
    if (!creep.memory.harvestPos) {
      return false;
    }
    const harvestPosition = deserializePosition(creep.memory.harvestPos, creep.room.name);
    const bay = _.find(creep.room.bays, bay => bay.name === encodePosition(harvestPosition!));

    if (!bay) {
      return false;
    }
    if (creep.pos.x !== bay.pos.x || creep.pos.y !== bay.pos.y) {
      return false;
    }

    if (creep.store.getUsedCapacity() >= creep.store.getCapacity() * (bay.needsRefill() ? 0.6 : 1)) {
      bay.refillFrom(creep);
    }
    if (bay.needsRefill()) {
      this.pickupEnergy(creep);
    }

    return bay.energyCapacity > 0;
  }

  /**
   * Makes a harvester pickup energy from the ground or a close container.
   *
   * @param {HarvesterCreep} creep
   *   The creep to run logic for.
   */
  pickupEnergy(creep: HarvesterCreep) {
    const resources = creep.pos.lookFor(LOOK_RESOURCES);
    const energy = _.find(resources, r => r.resourceType === RESOURCE_ENERGY);
    if (energy) {
      creep.pickup(energy);
      return;
    }

    const structures = creep.pos.lookFor(LOOK_STRUCTURES);
    const container = _.find(structures, s => s.structureType === STRUCTURE_CONTAINER);
    if (container && ((container as StructureContainer).store.energy || 0) > 0) {
      creep.withdraw(container, RESOURCE_ENERGY);
    }
  }

  /**
   * Makes a harvester deposit resources in nearby structures.
   *
   * @param {HarvesterCreep} creep
   *   The creep to run logic for.
   * @param {Source} source
   *   The source this harvester is assigned to.
   */
  depositResources(creep: HarvesterCreep, source: Source | Mineral) {
    const harvestPower = (source instanceof Source) ? HARVEST_POWER : HARVEST_MINERAL_POWER;
    if (creep.store.getFreeCapacity() >= creep.getActiveBodyparts(WORK) * harvestPower) {
      return;
    }

    const targetContainer = source.getNearbyContainer();

    if (
      !targetContainer
      && creep.store.energy > Math.max(creep.getActiveBodyparts(WORK) * BUILD_POWER, creep.store.getCapacity() - creep.getActiveBodyparts(WORK) * HARVEST_POWER)
      && _.filter(creep.room.creepsByRole.builder, c => c.store.getFreeCapacity() > 20).length === 0
    ) {
      // Check if there is a container construction site nearby and help build it.
      const sites = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 3, {
        filter: site => site.structureType === STRUCTURE_CONTAINER,
      });

      if (sites.length > 0) {
        creep.whenInRange(3, sites[0], () => creep.build(sites[0]));
        return;
      }
    }

    let target: StructureContainer | StructureLink | null = source.getNearbyContainer()!;
    if (target?.store.getFreeCapacity() === 0) {
      target = null;
    }

    if (source instanceof Source && creep.store.energy > 0) {
      const link = source.getNearbyLink();
      if (link && link.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        target = link;
      }
      else {
        // Check for other nearby links.
        const links: StructureLink[] = _.filter(
          creep.room.myStructuresByType[STRUCTURE_LINK],
          structure =>
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            && source.pos.getRangeTo(structure.pos) <= 3,
        );
        if (links.length > 0) {
          target = links[0];
        }
      }
    }

    if (target) {
      const distance = creep.pos.getRangeTo(target);
      creep.whenInRange(1, target, () => {
        if (target.structureType === STRUCTURE_CONTAINER && distance === 0) {
          // Nothing to do, resources will drop into the container.
        }
        else {
          creep.transferAny(target);
        }
      });
    }

    if (creep.room.controller!.level < 6 && creep.store.energy > 0) {
      const nearbyCreeps = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
        filter: (c) => {
          if (['transporter', 'upgrader', 'builder', 'builder.remote'].includes(c.memory.role!) && c.store.getFreeCapacity() > 0) {
            return true;
          }

          return false;
        },
      });

      if (nearbyCreeps.length > 0) {
        const targetCreep = _.sample(nearbyCreeps)!;
        creep.transfer(targetCreep!, RESOURCE_ENERGY, Math.min(creep.store.energy, targetCreep!.store.getFreeCapacity()));
      }
    }
  }

  /**
   * Dumps resources a harvester creep has gathered.
   *
   * @param {HarvesterCreep} creep
   *   The creep to run logic for.
   */
  performHarvesterDeliver(creep: HarvesterCreep) {
    if (!creep.memory.fixedSource && !creep.memory.fixedMineralSource) {
      return;
    }

    if (_.size(creep.room.creepsByRole.transporter) === 0) {
      // Use transporter drop off logic.
      this.transporterRole.performDeliver();
      return;
    }

    this.setHarvesterState(creep, true);
  }
}

export default HarvesterRole;
