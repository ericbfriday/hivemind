import groupBy from "lodash/groupBy";
import some from "lodash/some";
import max from "lodash/max";
import filter from "lodash/filter";
import cache from "utils/cache";
import container from "utils/container";
import TradeRoute from "trade-route";
import RoomStatus from "room/room-status";

interface TraderouteInfo {
  source: string;
  destination: string;
}

export default class FunnelManager {
  roomStatus: RoomStatus;

  constructor() {
    this.roomStatus = container.get("RoomStatus");
  }

  getRoomsToFunnel(): string[] {
    return cache.inHeap("funneledRooms", 500, () => {
      const funneledRooms: string[] = [];
      const roomsAtLevel = groupBy(
        this.getAvailableRoomsToFunnel(),
        (room) => room.controller.level,
      );

      const hasEnoughRCL8 = (roomsAtLevel[8]?.length || 0) > 1 || true;
      const hasRCL7 = (roomsAtLevel[7]?.length || 0) > 0;
      const hasRCL6 = (roomsAtLevel[6]?.length || 0) > 0;
      const hasEnoughRCL7 = (roomsAtLevel[7]?.length || 0) > 2;
      const hasTooMuchEnergy = some(
        Game.myRooms,
        (room) =>
          room.getEffectiveAvailableEnergy() > 300_000 &&
          room.controller.level === 8,
      );

      if (hasTooMuchEnergy) {
        // All rooms < RCL8 may upgrade.
        for (const room of [
          ...(roomsAtLevel[6] || []),
          ...(roomsAtLevel[7] || []),
        ]) {
          if (!funneledRooms.includes(room.name)) funneledRooms.push(room.name);
        }

        return funneledRooms;
      }

      if (hasEnoughRCL7 || (!hasRCL6 && hasRCL7)) {
        // Funnel to best RCL 7 room.
        funneledRooms.push(
          max(roomsAtLevel[7], (room) => this.getFunnelRoomScore(room)).name,
        );
      } else if (hasRCL6) {
        // Funnel to best RCL 6 or 7 room.
        funneledRooms.push(
          max(
            [...(roomsAtLevel[6] ?? []), ...(roomsAtLevel[7] ?? [])],
            (room) => this.getFunnelRoomScore(room),
          ).name,
        );
      }

      return funneledRooms;
    });
  }

  protected getAvailableRoomsToFunnel(): Room[] {
    return filter(Game.myRooms, (room) => {
      if (!room.terminal) return false;
      if (room.isStripmine() && room.controller.level >= 6) return false;
      if (room.isEvacuating()) return false;

      return true;
    });
  }

  protected getFunnelRoomScore(room: Room) {
    const energyNeededToUpgrade = Math.max(
      0,
      room.controller.progressTotal - room.controller.progress,
    );

    return (
      this.roomStatus.getExpansionScore(room.name) / (energyNeededToUpgrade + 1)
    );
  }

  isFunneling() {
    return this.getRoomsToFunnel().length > 0;
  }

  isFunnelingTo(roomName: string) {
    return this.getRoomsToFunnel().includes(roomName);
  }

  manageTradeRoutes() {
    const funnelTargets = filter(
      Game.myRooms,
      (room) =>
        room.storage &&
        room.controller.level < 6 &&
        room.storage.store.getUsedCapacity() <
          room.storage.store.getCapacity() / 2,
    );
    const funnelTradeRoutes = this.getRequestedFunnelTradeRoutes(funnelTargets);

    this.createAndUpdateTraderoutes(funnelTradeRoutes);
    this.removeUnneededTraderoutes(funnelTradeRoutes);
  }

  getRequestedFunnelTradeRoutes(funnelTargets: Room[]): TraderouteInfo[] {
    const tradeRoutes: TraderouteInfo[] = [];
    for (const room of funnelTargets) {
      const sourceRooms = filter(
        Game.myRooms,
        (sourceRoom) =>
          sourceRoom.controller.level >= 7 &&
          sourceRoom.getEffectiveAvailableEnergy() > 30_000 &&
          Game.map.getRoomLinearDistance(room.name, sourceRoom.name) <= 5,
      );
      for (const sourceRoom of sourceRooms) {
        tradeRoutes.push({
          source: sourceRoom.name,
          destination: room.name,
        });
      }
    }

    return tradeRoutes;
  }

  createAndUpdateTraderoutes(tradeRoutes: TraderouteInfo[]) {
    for (const route of tradeRoutes) {
      const name = "funnel:" + route.source + ":" + route.destination;
      const tradeRoute = new TradeRoute(name);
      tradeRoute.setResourceType(RESOURCE_ENERGY);
      tradeRoute.setTarget(route.destination);
      tradeRoute.setOrigin(route.source);
      tradeRoute.setActive(true);
    }
  }

  removeUnneededTraderoutes(tradeRoutes: TraderouteInfo[]) {
    const allowedNames = [];
    for (const route of tradeRoutes) {
      allowedNames.push("funnel:" + route.source + ":" + route.destination);
    }

    for (const name in Memory.tradeRoutes || {}) {
      if (!name.startsWith("funnel:")) continue;
      if (allowedNames.includes(name)) continue;

      const tradeRoute = new TradeRoute(name);
      tradeRoute.setActive(false);
    }
  }
}
