import _ from 'lodash';

const xOffsets = {
  [TOP]: 0,
  [TOP_RIGHT]: 1,
  [RIGHT]: 1,
  [BOTTOM_RIGHT]: 1,
  [BOTTOM]: 0,
  [BOTTOM_LEFT]: -1,
  [LEFT]: -1,
  [TOP_LEFT]: -1,
};

const yOffsets = {
  [TOP]: -1,
  [TOP_RIGHT]: -1,
  [RIGHT]: 0,
  [BOTTOM_RIGHT]: 1,
  [BOTTOM]: 1,
  [BOTTOM_LEFT]: 1,
  [LEFT]: 0,
  [TOP_LEFT]: -1,
};

const directions = {
  [-1]: {
    [-1]: TOP_LEFT,
    0: TOP,
    1: TOP_RIGHT,
  },
  0: {
    [-1]: LEFT,
    0: null,
    1: RIGHT,
  },
  1: {
    [-1]: BOTTOM_LEFT,
    0: BOTTOM,
    1: BOTTOM_RIGHT,
  },
};

/**
 * Serializes a position for storing it in memory.
 * @todo Move to RoomPosition.prototype.
 *
 * @param {RoomPosition} position
 *   The position to encode.
 *
 * @return {string}
 *   The encoded position.
 */
function encodePosition(position: RoomPosition): string {
  return `${position.roomName}@${position.x}x${position.y}`;
}

/**
 * Creates a RoomPosition object from serialized data.
 * @todo Move to RoomPosition as static function.
 *
 * @param {string} position
 *   The encoded position.
 *
 * @return {RoomPosition}
 *   The original room position.
 */
function decodePosition(position: string) {
  if (!position) {
    return null;
  }

  const parts = /^(.*)@(\d*)x(\d*)$/.exec(position);

  if (parts && parts.length > 0) {
    return new RoomPosition(Number.parseInt(parts[2]), Number.parseInt(parts[3]), parts[1]);
  }

  return null;
}

function serializeCoords(x: number, y: number): number;
function serializeCoords(x: number, y: number, roomName: string): [number, string];
function serializeCoords(x: number, y: number, roomName?: string) {
  const coords = x + (50 * y);

  if (!roomName) {
    return coords;
  }

  return [coords, roomName];
}

function deserializeCoords(coords: string | number | [number, string]) {
  // Fallback for old string positions.
  if (typeof coords === 'string') {
    const pos = decodePosition(coords)!;
    return { x: pos.x, y: pos.y };
  }

  // Numbers are positions without a room name.
  if (typeof coords === 'number') {
    const x = coords % 50;
    const y = Math.floor(coords / 50);
    return { x, y };
  }

  // Last alternative: Array of coords and room name.
  const x = coords[0] % 50;
  const y = Math.floor(coords[0] / 50);
  return { x, y };
}

function serializePosition(position: RoomPosition, fixedRoom?: string) {
  const name = position.roomName === fixedRoom ? null : position.roomName;
  if (name) {
    return serializeCoords(position.x, position.y, name);
  }
  return serializeCoords(position.x, position.y);
}

function deserializePosition(coords: string | number | [number, string], fixedRoom?: string) {
  // Fallback for old string positions.
  if (typeof coords === 'string') {
    return decodePosition(coords);
  }

  // Numbers are positions without a room name.
  if (typeof coords === 'number') {
    const x = coords % 50;
    const y = Math.floor(coords / 50);
    return new RoomPosition(x, y, fixedRoom!);
  }

  // Last alternative: Array of coords and room name.
  const x = coords[0] % 50;
  const y = Math.floor(coords[0] / 50);
  return new RoomPosition(x, y, coords[1]);
}

/**
 * Serializes an array of RoomPosition objects for storing in memory.
 *
 * @param {RoomPosition[]} path
 *   A list of positions to encode.
 *
 * @return {string[]}
 *   The encoded path.
 */
function serializePositionPath(path: RoomPosition[]): Array<string> {
  let previous: RoomPosition = { x: 0, y: 0, roomName: '' } as RoomPosition;
  return _.map(path, (pos) => {
    let result: number | null;
    if (previous && previous.roomName && previous.roomName === pos.roomName) {
      const dx = pos.x - previous.x;
      const dy = pos.y - previous.y;
      result = directions[dy] && directions[dy][dx];
    }

    previous = pos;
    // @ts-expect-error result is dumb
    return (result && String(result)) || encodePosition(pos);
  });
}

/**
 * Deserializes a serialized path into an array of RoomPosition objects.
 *
 * @param {string[]} path
 *   A list of positions to decode.
 *
 * @return {RoomPosition[]}
 *   The decoded path.
 */
function deserializePositionPath(path: Array<string | number>): RoomPosition[] {
  let pos: RoomPosition | null;
  return _.map(path, (location) => {
    pos = typeof location === 'string' ? decodePosition(location)! : (pos?.x && pos?.y && pos?.roomName) ? new RoomPosition(pos.x + xOffsets[location], pos.y + yOffsets[location], pos.roomName) : null;

    return pos;
  }).filter(Boolean) as RoomPosition[];
}

export {
  decodePosition,
  deserializeCoords,
  deserializePosition,
  deserializePositionPath,
  encodePosition,
  serializeCoords,
  serializePosition,
  serializePositionPath,
};
