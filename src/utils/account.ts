import size from "lodash/size";
import sample from "lodash/sample";
let ownUserName: string;

/**
 * Dynamically determines the username of the current user.
 *
 * @return {string}
 *   The determined user name.
 */
function getUsername(): string {
  if (ownUserName) return ownUserName;

  if (size(Game.spawns) === 0) {
    if (size(Game.creeps) === 0) {
      if (size(Game.myRooms) === 0) return "@undefined";

      ownUserName = sample(Game.myRooms).controller.owner.username;
      return ownUserName;
    }

    ownUserName = sample(Game.creeps).owner.username;
    return ownUserName;
  }

  ownUserName = sample(Game.spawns).owner.username;
  return ownUserName;
}

export { getUsername };
