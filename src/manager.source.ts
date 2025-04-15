/* global Source Mineral StructureKeeperLair LOOK_TERRAIN
FIND_STRUCTURES STRUCTURE_CONTAINER STRUCTURE_LINK STRUCTURE_KEEPER_LAIR */

import cache from '@/utils/cache';
import _ from 'lodash';

declare global {
  export interface Source {
    harvesters: HarvesterCreep[]
    getNumHarvestSpots: () => number
    getNearbyContainer: () => StructureContainer | null
    getNearbyLink: () => StructureLink | null
    getNearbyLair: () => StructureKeeperLair | null
  }

  export interface Mineral {
    harvesters: HarvesterCreep[]
    getNumHarvestSpots: () => number
    getNearbyContainer: () => StructureContainer | null
    getNearbyLair: () => StructureKeeperLair | null
  }
}

// Define quick access property source.harvesters.
Object.defineProperty(Source.prototype, 'harvesters', {
  /**
   * Gets a source's assigned harvesters.
   *
   * @return {Creep[]}
   *   Harvesters for this source.
   */
  get(this: Source) {
    return cache.inObject(this, 'harvesters', 1, () => {
      const harvesters: Creep[] = [];
      for (const harvester of Object.values(this.room.creepsByRole.harvester) || []) {
        if ((harvester.memory as HarvesterCreepMemory).fixedSource! === this.id) {
          harvesters.push(harvester);
        }
      }

      return harvesters;
    });
  },
  enumerable: false,
  configurable: true,
});

// Define quick access property mineral.harvesters.
Object.defineProperty(Mineral.prototype, 'harvesters', {
  /**
   * Gets a mineral's assigned harvesters.
   *
   * @return {Creep[]}
   *   Harvesters for this mineral.
   */
  get(this: Mineral) {
    return cache.inObject(this, 'harvesters', 1, () => {
      const harvesters: Creep[] = [];
      for (const harvester of Object.values(this.room!.creepsByRole.harvester) || []) {
        if ((harvester.memory as HarvesterCreepMemory)!.fixedMineralSource === this.id) {
          harvesters.push(harvester);
        }
      }

      return harvesters;
    });
  },
  enumerable: false,
  configurable: true,
});

/**
 * Calculates and caches the number of walkable tiles around a source.
 *
 * @return {number}
 *   Maximum number of harvesters on this source.
 */
function getHarvestSpotCount(this: Source | Mineral) {
  return cache.inHeap(`numFreeSquares:${this.id}`, 5000, () => {
    const terrain = this.room!.lookForAtArea(LOOK_TERRAIN, this.pos.y - 1, this.pos.x - 1, this.pos.y + 1, this.pos.x + 1, true);
    const adjacentTerrain: LookForAtAreaResultWithPos<Terrain, 'terrain'>[] = [];
    for (const tile of terrain) {
      if (tile.x === this.pos.x && tile.y === this.pos.y) {
        continue;
      }
      if (tile.terrain !== 'plain' && tile.terrain !== 'swamp') {
        continue;
      }

      // Make sure no structures are blocking this tile.
      const structures = this.room!.lookForAt(LOOK_STRUCTURES, tile.x, tile.y);
      if (_.some(structures, (s: Structure) => !s.isWalkable())) {
        continue;
      }

      adjacentTerrain.push(tile);
    }

    return adjacentTerrain.length;
  });
}

/**
 * Calculates and caches the number of walkable tiles around a source.
 *
 * @return {number}
 *   Maximum number of harvesters on this source.
 */
Source.prototype.getNumHarvestSpots = function (this: Source) {
  return getHarvestSpotCount.call(this);
};

/**
 * Calculates and caches the number of walkable tiles around a source.
 *
 * @return {number}
 *   Maximum number of harvesters on this mineral.
 */
Mineral.prototype.getNumHarvestSpots = function (this: Mineral) {
  return getHarvestSpotCount.call(this);
};

/**
 * Finds a container in close proximity to this target, for dropping off resources.
 *
 * @return {StructureContainer}
 *   A container close to this source.
 */
function getNearbyContainer(this: Source | Mineral) {
  const containerId = cache.inHeap(`container:${this.id}`, 150, () => {
    // Check if there is a container nearby.
    // @todo Could use old data and just check if object still exits.
    const structures: StructureContainer[] = _.filter(this.room!.structuresByType[STRUCTURE_CONTAINER], (s) => {
      if (s.pos.getRangeTo(this) > 5) {
        return false;
      }

      if (!this.room!.roomPlanner) {
        return true;
      }

      const positionType = (this instanceof Source) ? 'container.source' : 'container.mineral';
      if (this.room!.roomPlanner.isPlannedLocation(s.pos, positionType)) {
        return true;
      }

      return false;
    });
    if (structures.length > 0) {
      const structure = this.pos.findClosestByRange(structures);
      return structure?.id ?? null;
    }

    return null;
  });

  if (containerId) {
    return Game.getObjectById<StructureContainer>(containerId);
  }

  return null;
}

/**
 * Finds a container in close proximity to this source, for dropping off energy.
 *
 * @return {StructureContainer}
 *   A container close to this source.
 */
Source.prototype.getNearbyContainer = function (this: Source) {
  return getNearbyContainer.call(this);
};

/**
 * Finds a container in close proximity to this mineral, for dropping off resources.
 *
 * @return {StructureContainer}
 *   A container close to this mineral.
 */
Mineral.prototype.getNearbyContainer = function (this: Mineral) {
  return getNearbyContainer.call(this);
};

/**
 * Finds a link in close proximity to this source, for dropping off energy.
 *
 * @return {StructureLink}
 *   A link close to this source.
 */
Source.prototype.getNearbyLink = function (this: Source) {
  const linkId = cache.inHeap(`link:${this.id}`, 1000, () => {
    // @todo Could use old data and just check if object still exits.
    // Check if there is a link nearby.
    const structures = this.pos.findInRange(FIND_STRUCTURES, 3, {
      filter: structure => structure.structureType === STRUCTURE_LINK,
    });
    if (structures.length > 0) {
      const structure = this.pos.findClosestByRange(structures);
      return structure?.id ?? null;
    }

    return null;
  });

  if (linkId) {
    return Game.getObjectById(linkId as Id<StructureLink>);
  }

  return null;
};

/**
 * Finds a source keeper lair in close proximity to this source.
 *
 * @return {StructureKeeperLair}
 *   The lair protecting this source.
 */
function getNearbyLair(this: Source | Mineral) {
  const lairId = cache.inHeap(`lair:${this.id}`, 150_000, () => {
    // @todo Could use old data and just check if object still exits.
    // Check if there is a lair nearby.
    const structures = this.pos.findInRange(FIND_STRUCTURES, 10, {
      filter: structure => structure.structureType === STRUCTURE_KEEPER_LAIR,
    });
    if (structures.length > 0) {
      const structure = this.pos.findClosestByRange(structures);
      return structure?.id ?? null;
    }

    return null;
  });

  if (lairId) {
    return Game.getObjectById(lairId);
  }

  return null;
}

/**
 * Finds a source keeper lair in close proximity to this source.
 *
 * @return {StructureKeeperLair}
 *   The lair protecting this source.
 */
Source.prototype.getNearbyLair = function (this: Source) {
  return getNearbyLair.call(this);
};

/**
 * Finds a source keeper lair in close proximity to this mineral.
 *
 * @return {StructureKeeperLair}
 *   The lair protecting this mineral.
 */
Mineral.prototype.getNearbyLair = function (this: Mineral) {
  return getNearbyLair.call(this);
};
