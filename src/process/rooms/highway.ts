import { getRoomIntel } from '@/room-intel';
import cache from '@/utils/cache';
import { isCrossroads } from '@/utils/room-name';
import _ from 'lodash';
import Process from 'process/process';

declare global {
    export interface StrategyMemory {
        caravans?: Record<string, {
            creeps: Array<Id<Creep>>
            dir: TOP | BOTTOM | LEFT | RIGHT
            firstSeen: number
            expires: number
            rooms: Array<{
                name: string
                time: number
            }>
            contents: Partial<Record<ResourceConstant, number>>
        }>
    }
}

export default HighwayRoomProcess;
export class HighwayRoomProcess extends Process {
    room: Room;

    /**
     * Manages rooms we own.
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
     * Manages one of our rooms.
     */
    run() {
        this.detectCaravans();
        this.pruneOldCaravans();
    }

    detectCaravans() {
        for (const creep of this.room.enemyCreeps[SYSTEM_USERNAME] || []) {
            const id = this.getCaravanId(creep);
            if (!id) {
                continue;
            }

            this.registerCaravan(id);
        }
    }

    getCaravanId(creep: Creep): string {
        if (!creep.name.includes('_', creep.name.length - 2)) {
            return null;
        }

        return creep.name.slice(0, Math.max(0, creep.name.length - 2));
    }

    registerCaravan(id: string) {
        if (!Memory.strategy) {
            Memory.strategy = {} as StrategyMemory;
        }
        if (!Memory.strategy.caravans) {
            Memory.strategy.caravans = {};
        }

        const creeps = _.sortBy(_.filter(this.room.enemyCreeps[SYSTEM_USERNAME], c => c.name.startsWith(id)), c => c.name);
        if (Memory.strategy.caravans[id] && creeps.length < Memory.strategy.caravans[id].creeps.length) {
            // Don't update info about caravans that are already registered if we
            // can't see all previously known creeps.
            return;
        }

        const direction = this.detectDirection(creeps);
        if (!direction) {
            return;
        }

        const firstSeen = Memory.strategy.caravans[id]?.firstSeen || Game.time;
        const rooms = this.getTraversedRooms(direction, creeps, firstSeen);

        Memory.strategy.caravans[id] = {
            firstSeen,
            creeps: creeps.map(c => c.id),
            dir: direction,
            expires: rooms[rooms.length - 1].time + 50,
            rooms,
            contents: this.getStoreContents(creeps),
        };
    }

    detectDirection(creeps: Creep[]): TOP | BOTTOM | LEFT | RIGHT {
        const minX = _.minBy(creeps, c => c.pos.x);
        const maxX = _.maxBy(creeps, c => c.pos.x);
        const minY = _.minBy(creeps, c => c.pos.y);
        const maxY = _.maxBy(creeps, c => c.pos.y);

        const first = creeps[0].id;
        const last = creeps[creeps.length - 1].id;

        // If moving diagonally we need to adjust direction based on what kind
        // of highway room it is.
        const allowVertical = isCrossroads(this.room.name) || !this.room.name.endsWith('0');
        const allowHorizontal = isCrossroads(this.room.name) || this.room.name.endsWith('0');

        if (allowHorizontal && minX.id === first && maxX.id === last) {
            return LEFT;
        }
        if (allowHorizontal && maxX.id === first && minX.id === last) {
            return RIGHT;
        }
        if (allowVertical && minY.id === first && maxY.id === last) {
            return TOP;
        }
        if (allowVertical && maxY.id === first && minY.id === last) {
            return BOTTOM;
        }

        return null;
    }

    getTraversedRooms(direction: TOP | BOTTOM | LEFT | RIGHT, creeps: Creep[], firstSeen: number): Array<{ name: string, time: number }> {
        const rooms: Array<{ name: string, time: number }> = [];

        rooms.push({
            name: this.room.name,
            time: Game.time,
        });

        const skipFirstCrossroads = isCrossroads(this.room.name) && Game.time - firstSeen < 75;
        // @todo Estimate how far caravan needs to travel to room edge.
        let nextTime = Game.time + 50;
        let roomName = this.room.name;
        while (!isCrossroads(roomName) || (roomName === this.room.name && skipFirstCrossroads)) {
            const roomIntel = getRoomIntel(roomName);
            const exits = roomIntel.getAge() < 10_000 ? roomIntel.getExits() : Game.map.describeExits(roomName);
            if (!exits[direction]) {
                break;
            }

            roomName = exits[direction];
            rooms.push({
                name: roomName,
                time: nextTime,
            });
            nextTime += 99 - creeps.length;
        }

        return rooms;
    }

    getStoreContents(creeps: Creep[]): Record<string, number> {
        const result: Record<string, number> = {};

        for (const creep of creeps) {
            for (const resourceType in creep.store) {
                result[resourceType] = (result[resourceType] || 0) + (creep.store[resourceType] || 0);
            }
        }

        return result;
    }

    pruneOldCaravans() {
        cache.inHeap('pruneOldCaravans', 1000, () => {
            const caravanMemory = Memory?.strategy?.caravans || {};
            for (const id in caravanMemory) {
                if (caravanMemory[id].expires < Game.time - 2500) {
                    // This caravan is long gone. No need to keep it in memory.
                    delete caravanMemory[id];
                }
            }
        });
    }
}
