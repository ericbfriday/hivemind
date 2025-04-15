import type TrafficManager from '@/creep/traffic-manager';
import CreepManager from '@/creep-manager';
import hivemind from '@/hivemind';
import utilities from '@/utilities';
import container from '@/utils/container';
import _ from 'lodash';

import Process from 'process/process';
import brawlerRole from 'role/brawler';
import builderRole from 'role/builder';
import mineBuilderRole from 'role/builder.mines';
import remoteBuilderRole from 'role/builder.remote';
import claimerRole from 'role/claimer';
import dismantlerRole from 'role/dismantler';
import guardianRole from 'role/guardian';
import harvesterRole from 'role/harvester';
import depositHarvesterRole from 'role/harvester.deposit';
import remoteHarvesterRole from 'role/harvester.remote';
import relayHaulerRole from 'role/hauler.relay';
import helperRole from 'role/helper';
import muleRole from 'role/mule';
// Power creep roles.
import OperatorRole from 'role/power-creep/operator';
import poweHarvesterRole from 'role/power/harvester';
import powerHaulerRole from 'role/power/hauler';
import scoutRole from 'role/scout';
import transporterRole from 'role/transporter';

import unassignedRole from 'role/unassigned';
import upgraderRole from 'role/upgrader';
// Normal creep roles.
const creepRoles = {
  'brawler': brawlerRole,
  'builder': builderRole,
  'builder.mines': mineBuilderRole,
  'builder.remote': remoteBuilderRole,
  'claimer': claimerRole,
  'dismantler': dismantlerRole,
  'guardian': guardianRole,
  'harvester': harvesterRole,
  'harvester.deposit': depositHarvesterRole,
  'harvester.power': poweHarvesterRole,
  'harvester.remote': remoteHarvesterRole,
  'hauler.power': powerHaulerRole,
  'hauler.relay': relayHaulerRole,
  'helper': helperRole,
  'mule': muleRole,
  'scout': scoutRole,
  // skKiller: skKillerRole,
  'transporter': transporterRole,
  'unassigned': unassignedRole,
  'upgrader': upgraderRole,
};

export default CreepsProcess;
export class CreepsProcess extends Process {
  creepManager: CreepManager;
  powerCreepManager: CreepManager;
  trafficManager: TrafficManager;

  /**
   * Runs logic for all creeps and power creeps.
   * @constructor
   *
   * @param {object} parameters
   *   Options on how to run this process.
   */
  constructor(parameters: ProcessParameters) {
    super(parameters);

    this.creepManager = new CreepManager();
    for (const roleName in creepRoles) {
      const RoleClass = creepRoles[roleName];
      this.creepManager.registerCreepRole(roleName, new RoleClass());
    }

    this.powerCreepManager = new CreepManager();
    this.powerCreepManager.registerCreepRole('operator', new OperatorRole());

    this.trafficManager = container.get('TrafficManager');
  }

  /**
   * Runs logic for all creeps.
   */
  run() {
    // Run normal creeps.
    this.creepManager.onTickStart();
    _.each(Game.creepsByRole, (creeps, role) => {
      if (!this.creepManager.hasRole(role)) {
        return;
      }

      hivemind.runSubProcess(`creeps_${role}`, () => {
        utilities.bubbleWrap(() => {
          this.creepManager.manageCreeps(creeps);
        });
      });
    });
    this.creepManager.report();

    // Run power creeps.
    const powerCreeps = _.filter(Game.powerCreeps, creep => (creep.ticksToLive || 0) > 0);
    this.powerCreepManager.onTickStart();
    hivemind.runSubProcess('creeps_powerCreeps', () => {
      utilities.bubbleWrap(() => {
        this.powerCreepManager.manageCreeps(powerCreeps);
      });
    });
    this.powerCreepManager.report();

    // Resolve traffic jams.
    hivemind.runSubProcess('creeps_trafficManager', () => {
      this.trafficManager.manageTraffic();
    });
  }
}
