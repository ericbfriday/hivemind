import hivemind from '@/hivemind';
import PlayerIntel from '@/player-intel';

export class PlayerIntelManager {
    intelCache: Record<string, PlayerIntel> = {};

    /**
     * Factory method for player intel objects.
     *
     * @param {string} userName
     *   The user for whom to get intel.
     *
     * @return {PlayerIntel}
     *   The requested PlayerIntel object.
     */
    get(userName: string): PlayerIntel {
        if (!hivemind.segmentMemory.isReady()) {
            throw new Error(`Memory is not ready to generate player intel for user "${userName}".`);
        }

        if (!this.intelCache[userName]) {
            this.intelCache[userName] = new PlayerIntel(userName);
        }

        this.intelCache[userName].cleanupMemory();

        return this.intelCache[userName];
    }

    getAll(): PlayerIntel[] {
        if (!hivemind.segmentMemory.isReady()) {
            throw new Error('Memory is not ready to generate player intel.');
        }

        const result = [];
        hivemind.segmentMemory.each('u-intel:', (key) => {
            const userName = key.slice(8);
            const intel = this.get(userName);

            result.push(intel);
        });

        return result;
    }

    updateOwnedRoom(userName: string, roomName: string) {
        const playerIntel = this.get(userName);

        playerIntel.updateOwnedRoom(roomName);
    }

    updateClaimedRoom(userName: string, roomName: string) {
        const playerIntel = this.get(userName);

        playerIntel.updateRemote(roomName);
    }

    updateCreepSighting(userName: string, roomName: string, creeps: Creep[]) {
        const playerIntel = this.get(userName);

        playerIntel.updateCreeps(creeps);
    }
}

export default PlayerIntelManager;
