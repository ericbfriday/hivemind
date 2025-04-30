import _ from "es-toolkit";
interface Coord {
  x: number;
  y: number;
}

declare global {
  namespace NodeJS {
    interface Global {
      packId: <T extends _HasId>(id: Id<T>) => string;
      unpackId: <T extends _HasId>(packedId: string) => Id<T>;
      packIdList: <T extends _HasId>(ids: Array<Id<T>>) => string;
      unpackIdList: <T extends _HasId>(packedIds: string) => Array<Id<T>>;
      packCoord: (coord: Coord) => string;
      unpackCoord: (char: string) => Coord;
      unpackCoordAsPos: (char: string, roomName: string) => RoomPosition;
      packCoordList: (coords: Coord[]) => string;
      unpackCoordList: (chars: string) => Coord[];
      unpackCoordListAsPosList: (
        chars: string,
        roomName: string,
      ) => RoomPosition[];
      packPos: (pos: RoomPosition) => string;
      unpackPos: (chars: string) => RoomPosition;
      packPosList: (positions: RoomPosition[]) => string;
      unpackPosList: (chars: string) => RoomPosition[];
      packRoomName: (roomName: string) => string;
      unpackRoomName: (packed: string) => string;
    }
  }
}

/**
 * Screeps-packrat
 * ---------------
 * Lightning-fast and memory-efficient serialization of Screeps IDs, Coords, and RoomPositions
 * Code written by Muon as part of Overmind Screeps AI. Feel free to adapt as desired.
 * Package repository: https://github.com/bencbartlett/screeps-packrat
 *
 * TypeScript version is available in the #share-thy-code channel on the Screeps Slack.
 *
 * To use: import desired functions from module, or import entire module on main and use functions from global.
 * To benchmark: PackratTests.run()
 *
 * Exported functions (available on global):
 *
 * +--------------------------+------------------------------------------------+-----------------+--------------------+
 * |         function         |                  description                   | execution time* | memory reduction** |
 * +--------------------------+------------------------------------------------+-----------------+--------------------+
 * | packId                   | packs a game object id into 6 chars            | 500ns           | -75%               |
 * | unpackId                 | unpacks 6 chars into original format           | 1.3us           |                    |
 * | packIdList               | packs a list of ids into a single string       | 500ns/id        | -81%               |
 * | unpackIdList             | unpacks a string into a list of ids            | 1.2us/id        |                    |
 * | packPos                  | packs a room position into 2 chars             | 150ns           | -90%               |
 * | unpackPos                | unpacks 2 chars into a room position           | 600ns           |                    |
 * | packPosList              | packs a list of room positions into a string   | 150ns/pos       | -95%               |
 * | unpackPosList            | unpacks a string into a list of room positions | 1.5us/pos       |                    |
 * | packCoord                | packs a coord (e.g. {x:25,y:25}) as a string   | 150ns           | -80%               |
 * | unpackCoord              | unpacks a string into a coord                  | 60-150ns        |                    |
 * | packCoordList            | packs a list of coords as a string             | 120ns/coord     | -94%               |
 * | unpackCoordList          | unpacks a string into a list of coords         | 100ns/coord     |                    |
 * | unpackCoordAsPos         | unpacks string + room name into a pos          | 500ns           |                    |
 * | unpackCoordListAsPosList | unpacks string + room name into a list of pos  | 500ns/coord     |                    |
 * +--------------------------+------------------------------------------------+-----------------+--------------------+
 *
 *  * Execution time measured on shard2 public servers and may vary on different machines or shards.
 * ** Memory reduction for list functions is the asymptotic limit of lists containing many entries. Lower reductions
 *    can be expected for smaller lists.
 */

const PERMACACHE: {
  _packedRoomNames?: Record<string, string>;
  _unpackedRoomNames?: Record<string, string>;
} = {}; // Create a permanent cache for immutable items such as room names

/**
 * Convert a standard 24-character hex id in screeps to a compressed UTF-16 encoded string of length 6.
 *
 * Benchmarking: average of 500ns to execute on shard2 public server, reduce stringified size by 75%
 */
function packId<T extends _HasId>(id: Id<T>): string {
  return (
    String.fromCharCode(Number.parseInt(id.slice(0, 4), 16)) +
    String.fromCharCode(Number.parseInt(id.slice(4, 8), 16)) +
    String.fromCharCode(Number.parseInt(id.slice(8, 12), 16)) +
    String.fromCharCode(Number.parseInt(id.slice(12, 16), 16)) +
    String.fromCharCode(Number.parseInt(id.slice(16, 20), 16)) +
    String.fromCharCode(Number.parseInt(id.slice(20, 24), 16))
  );
}

/**
 * Convert a compressed six-character UTF-encoded id back into the original 24-character format.
 *
 * Benchmarking: average of 1.3us to execute on shard2 public server
 */
function unpackId<T extends _HasId>(packedId: string): Id<T> {
  let id = "";
  let current;
  for (let i = 0; i < 6; ++i) {
    current = packedId.charCodeAt(i);
    id += (current >>> 8).toString(16).padStart(2, "0"); // String.padStart() requires es2017+ target
    id += (current & 0xff).toString(16).padStart(2, "0");
  }

  return id as Id<T>;
}

/**
 * Packs a list of ids as a utf-16 string. This is better than having a list of packed coords, as it avoids
 * extra commas and "" when memory gets stringified.
 *
 * Benchmarking: average of 500ns per id to execute on shard2 public server, reduce stringified size by 81%
 */
function packIdList<T extends _HasId>(ids: Array<Id<T>>): string {
  let string = "";
  for (const id of ids) {
    string += packId(id);
  }

  return string;
}

/**
 * Unpacks a list of ids stored as a utf-16 string.
 *
 * Benchmarking: average of 1.2us per id to execute on shard2 public server.
 */
function unpackIdList<T extends _HasId>(packedIds: string): Array<Id<T>> {
  const ids: Array<Id<T>> = [];
  for (let i = 0; i < packedIds.length; i += 6) {
    ids.push(unpackId(packedIds.slice(i, i + 6)));
  }

  return ids;
}

/**
 * Packs a coord as a single utf-16 character. The seemingly strange choice of encoding value ((x << 6) | y) + 65 was
 * chosen to be fast to compute (x << 6 | y is significantly faster than 50 * x + y) and to avoid control characters,
 * as "A" starts at character code 65.
 *
 * Benchmarking: average of 150ns to execute on shard2 public server, reduce stringified size by 80%
 */
function packCoord(coord: Coord): string {
  return String.fromCharCode(((coord.x << 6) | coord.y) + 65);
}

/**
 * Unpacks a coord stored as a single utf-16 character
 *
 * Benchmarking: average of 60ns-100ns to execute on shard2 public server
 */
function unpackCoord(char: string): Coord {
  const xShiftedSixOrY = char.charCodeAt(0) - 65;
  return {
    x: (xShiftedSixOrY & 0b1111_1100_0000) >>> 6,
    y: xShiftedSixOrY & 0b0000_0011_1111,
  };
}

/**
 * Unpacks a coordinate and creates a RoomPosition object from a specified roomName
 *
 * Benchmarking: average of 500ns to execute on shard2 public server
 */
function unpackCoordAsPos(packedCoord: string, roomName: string): RoomPosition {
  const coord = unpackCoord(packedCoord);
  return new RoomPosition(coord.x, coord.y, roomName);
}

/**
 * Packs a list of coords as a utf-16 string. This is better than having a list of packed coords, as it avoids
 * extra commas and "" when memroy gets stringified.
 *
 * Benchmarking: average of 120ns per coord to execute on shard2 public server, reduce stringified size by 94%
 */
function packCoordList(coords: Coord[]): string {
  let string = "";
  for (const coord of coords) {
    string += String.fromCharCode(((coord.x << 6) | coord.y) + 65);
  }

  return string;
}

/**
 * Unpacks a list of coords stored as a utf-16 string
 *
 * Benchmarking: average of 100ns per coord to execute on shard2 public server
 */
function unpackCoordList(chars: string): Coord[] {
  const coords: Coord[] = [];
  let xShiftedSixOrY;
  for (let i = 0; i < chars.length; ++i) {
    xShiftedSixOrY = chars.charCodeAt(i) - 65;
    coords.push({
      x: (xShiftedSixOrY & 0b1111_1100_0000) >>> 6,
      y: xShiftedSixOrY & 0b0000_0011_1111,
    });
  }

  return coords;
}

/**
 * Unpacks a list of coordinates and creates a list of RoomPositions from a specified roomName
 *
 * Benchmarking: average of 500ns per coord to execute on shard2 public server
 */
function unpackCoordListAsPosList(
  packedCoords: string,
  roomName: string,
): RoomPosition[] {
  const positions: RoomPosition[] = [];
  let coord: Coord;
  for (const packedCoord of packedCoords) {
    // Each coord is saved as a single character; unpack each and insert the room name to get the positions list
    coord = unpackCoord(packedCoord);
    positions.push(new RoomPosition(coord.x, coord.y, roomName));
  }

  return positions;
}

PERMACACHE._packedRoomNames = PERMACACHE._packedRoomNames || {};
PERMACACHE._unpackedRoomNames = PERMACACHE._unpackedRoomNames || {};

/**
 * Packs a roomName as a single utf-16 character. Character values are stored on permacache.
 */
function packRoomName(roomName: string): string {
  if (PERMACACHE._packedRoomNames[roomName] === undefined) {
    const coordinateRegex = /(E|W)(\d+)(N|S)(\d+)/g;
    const match = coordinateRegex.exec(roomName);
    const xDir = match[1];
    const x = Number(match[2]);
    const yDir = match[3];
    const y = Number(match[4]);
    let quadrant;
    if (xDir === "W") {
      quadrant = yDir === "N" ? 0 : 1;
    } else if (yDir === "N") {
      quadrant = 2;
    } else {
      quadrant = 3;
    }

    // Y is 6 bits, x is 6 bits, quadrant is 2 bits
    const number = ((quadrant << 13) | (x * 90 + y)) + 65;
    const char = String.fromCharCode(number);
    PERMACACHE._packedRoomNames[roomName] = char;
    PERMACACHE._unpackedRoomNames[char] = roomName;
  }

  return PERMACACHE._packedRoomNames[roomName];
}

/**
 * Packs a roomName as a single utf-16 character. Character values are stored on permacache.
 */
function unpackRoomName(char: string): string {
  if (PERMACACHE._unpackedRoomNames[char] === undefined) {
    const number = char.charCodeAt(0) - 65;
    const coords = number & 0b001_1111_1111_1111;
    const { q, x, y } = {
      q: (number & 0b110_0000_0000_0000) >>> 13,
      x: Math.floor(coords / 90),
      y: coords % 90,
    };
    let roomName: string;
    switch (q) {
      case 0:
        roomName = `W${x}N${y}`;
        break;
      case 1:
        roomName = `W${x}S${y}`;
        break;
      case 2:
        roomName = `E${x}N${y}`;
        break;
      case 3:
        roomName = `E${x}S${y}`;
        break;
      default:
        roomName = "ERROR";
    }

    PERMACACHE._packedRoomNames[roomName] = char;
    PERMACACHE._unpackedRoomNames[char] = roomName;
  }

  return PERMACACHE._unpackedRoomNames[char];
}

/**
 * Packs a RoomPosition as a pair utf-16 characters. The seemingly strange choice of encoding value ((x << 6) | y) + 65
 * was chosen to be fast to compute (x << 6 | y is significantly faster than 50 * x + y) and to avoid control
 * characters, as "A" starts at character code 65.
 *
 * Benchmarking: average of 150ns to execute on shard2 public server, reduce stringified size by 90%
 */
function packPos(pos: RoomPosition): string {
  return packCoord(pos) + packRoomName(pos.roomName);
}

/**
 * Unpacks a RoomPosition stored as a pair of utf-16 characters.
 *
 * Benchmarking: average of 600ns to execute on shard2 public server.
 */
function unpackPos(chars: string): RoomPosition {
  const { x, y } = unpackCoord(chars[0]);
  return new RoomPosition(x, y, unpackRoomName(chars[1]));
}

/**
 * Packs a list of RoomPositions as a utf-16 string. This is better than having a list of packed RoomPositions, as it
 * avoids extra commas and "" when memroy gets stringified.
 *
 * Benchmarking: average of 150ns per position to execute on shard2 public server, reduce stringified size by 95%
 */
function packPosList(posList: RoomPosition[]): string {
  let string = "";
  for (const element of posList) {
    string += packPos(element);
  }

  return string;
}

/**
 * Unpacks a list of RoomPositions stored as a utf-16 string.
 *
 * Benchmarking: average of 1.5us per position to execute on shard2 public server.
 */
function unpackPosList(chars: string): RoomPosition[] {
  const posList: RoomPosition[] = [];
  for (let i = 0; i < chars.length; i += 2) {
    posList.push(unpackPos(chars.slice(i, i + 2)));
  }

  return posList;
}

// Export everything
export {
  packId,
  unpackId,
  packIdList,
  unpackIdList,
  packCoord,
  unpackCoord,
  unpackCoordAsPos,
  packCoordList,
  unpackCoordList,
  unpackCoordListAsPosList,
  packPos,
  unpackPos,
  packPosList,
  unpackPosList,
  packRoomName,
  unpackRoomName,
};

// Useful to register these functions on global to use with console
global.packId = packId;
global.unpackId = unpackId;
global.packIdList = packIdList;
global.unpackIdList = unpackIdList;
global.packCoord = packCoord;
global.unpackCoord = unpackCoord;
global.unpackCoordAsPos = unpackCoordAsPos;
global.packCoordList = packCoordList;
global.unpackCoordList = unpackCoordList;
global.unpackCoordListAsPosList = unpackCoordListAsPosList;
global.packPos = packPos;
global.unpackPos = unpackPos;
global.packPosList = packPosList;
global.unpackPosList = unpackPosList;
global.packRoomName = packRoomName;
global.unpackRoomName = unpackRoomName;
