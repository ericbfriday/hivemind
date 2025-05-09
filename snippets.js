import forEach from "lodash/forEach";
import sortBy from "lodash/sortBy";
import map from "lodash/map";
import each from "lodash/each";
import reduce from "lodash/reduce";
import size from "lodash/size";
/**
 * Contains small code snippets for use in the console. Do not require this file.
 */
/* global FIND_CONSTRUCTION_SITES */

// Remove all constructions sites in a roon you have vision in:
forEach(Game.rooms.E49S48.find(FIND_CONSTRUCTION_SITES), (s) => s.remove());

// Show CPU usage for all processes for 100 ticks.
Memory.hivemind.showProcessDebug = 100;

// Draw room planner debug visuals for 100 ticks.
Game.rooms.E49S51.roomPlanner.memory.drawDebug = 100;

// Re-run room planner for a room.
Game.rooms.E49S51.roomPlanner.startRoomPlanGeneration();

// Find out which processes use a lot of CPU
JSON.stringify(
  sortBy(
    map(Memory.hivemind.process, (a, b) => {
      a.name = b;
      return a;
    }),
    (a) => -a.cpu,
  ),
);

// Find out which operations use a lot of CPU
const m = [];
each(Memory.operations, (o, name) => {
  m.push({ name, cpu: o.stats.cpu / o.statTicks });
});
JSON.stringify(sortBy(m, "cpu"));

// Find out which mining operations are most profitable per CPU used
const mem = [];
each(Memory.operations, (o, name) => {
  if (o.type !== "mining") return;
  mem.push({ name, income: o.stats.energy / o.stats.cpu });
});
JSON.stringify(sortBy(mem, "income"));

// Find out where a lot of memory is used:
JSON.stringify(
  sortBy(
    map(Memory, (data, key) => {
      return { key, size: JSON.stringify(data).length };
    }),
    "size",
  ),
);
JSON.stringify(
  reduce(
    map(Memory.rooms, (roomData) => {
      const result = {};
      each(
        roomData,
        (data, key) => (result[key] = JSON.stringify(data).length),
      );
      return result;
    }),
    (total, item) => {
      each(item, (value, key) => (total[key] = (total[key] || 0) + value));
      return total;
    },
  ),
);

// Calculate room value.
const p = new (require("process.strategy.scout"))();
p.generateMineralStatus();
Memory.hivemind.canExpand = true;
const r = [];
each(Game.rooms, (room) => {
  if (!room.isMine()) return;
  const i = p.calculateExpansionScore(room.name);
  i.roomName = room.name;
  r.push(i);
});
Memory.hivemind.canExpand = false;
console.log(JSON.stringify(r));

// Find energy source options for a transporter creep.
JSON.stringify(
  map(Game.creeps.T_ju.getAvailableEnergySources(), (option) => {
    option.object = (option.object || {}).id;
    return option;
  }),
);

// Find out how many creeps of each role are currently spawned.
each(Game.creepsByRole, (g, n) => console.log(size(g), n));

// Force expansion to a certain room.
r = { roomName: "E19N24", spawnRoom: "E16N22" };
new ExpandProcess().startExpansion(r);

// Force evacuation and abandonment of a certain room.
const roomName = "E43S53";
p = new ExpandProcess({}, {});
Game.rooms[roomName].setEvacuating(true);
Memory.strategy.expand.evacuatingRoom = { name: roomName, cooldown: null };

// Send a squad to operate in a room.
const s = new Squad("squadName");
s.setSpawn("W25S18");
s.setTarget(new RoomPosition(24, 24, "W28S19"));
a.addUnit("ranger");
