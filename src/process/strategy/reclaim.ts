import type ReclaimManager from 'reclaim-manager';
import Process from 'process/process';
import container from '@/utils/container';

export default ReclaimProcess;
export class ReclaimProcess extends Process {
  manager: ReclaimManager;

  constructor(parameters: ProcessParameters) {
    super(parameters);
    this.manager = container.get('ReclaimManager');
  }

  /**
   * Sends builders to destroyed rooms we still have control over.
   */
  run() {
    this.markReclaimableRooms();
    this.manager.cleanReclaimMemory();
  }

  /**
   * Keeps a record of reclaimable rooms.
   */
  markReclaimableRooms() {
    for (const room of Game.myRooms) {
      this.manager.updateReclaimStatus(room);
    }
  }
}
