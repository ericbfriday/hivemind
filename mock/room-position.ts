const RoomPosition = function (
  this: RoomPosition,
  x: number,
  y: number,
  roomName: string,
) {
  this.x = Number(x);
  this.y = Number(y);
  this.roomName = roomName;
};

export default RoomPosition;
