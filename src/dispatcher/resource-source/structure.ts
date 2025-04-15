import TaskProvider from '@/dispatcher/task-provider';
import { getDangerMatrix } from '@/utils/cost-matrix';

declare global {
  export interface StructureSourceTask extends ResourceSourceTask {
    target: Id<AnyStoreStructure>
  }
}

export default StructureSource<TaskType extends StructureSourceTask>;
export class StructureSource<TaskType extends StructureSourceTask> extends TaskProvider<TaskType, ResourceSourceContext> {
  constructor(readonly room: Room) {
    super();
  }

  getType() {
    return 'structure';
  }

  getHighestPriority() {
    return 0;
  }

  getTasks(context?: ResourceSourceContext) {
    return [];
  }

  isValid(task: TaskType, context: ResourceSourceContext) {
    if (!task.resourceType) {
      return false;
    }
    const structure = Game.getObjectById(task.target);
    if (!structure) {
      return false;
    }
    if (structure.store.getUsedCapacity(task.resourceType) === 0) {
      return false;
    }
    if (context.creep.store.getFreeCapacity(task.resourceType) === 0) {
      return false;
    }
    if (!this.isSafePosition(context.creep, structure.pos)) {
      return false;
    }

    return true;
  }

  execute(task: TaskType, context: ResourceSourceContext) {
    const creep = context.creep;
    const target = Game.getObjectById(task.target);

    creep.whenInRange(1, target, () => {
      const resourceType = task.resourceType;

      let result: ScreepsReturnCode;
      if (task.amount) {
        result = creep.withdraw(target, resourceType, Math.min(target.store.getUsedCapacity(resourceType), creep.memory.order.amount, creep.store.getFreeCapacity()));
      }
      else {
        result = creep.withdraw(target, resourceType);
      }

      if (result === OK) {
        delete creep.memory.order;
      }
    });
  }

  isSafePosition(creep: Creep, pos: RoomPosition): boolean {
    if (!creep.room.isMine()) {
      return true;
    }
    if (creep.room.defense.getEnemyStrength() === 0) {
      return true;
    }

    const matrix = getDangerMatrix(creep.room.name);
    if (matrix.get(pos.x, pos.y) > 0) {
      return false;
    }

    return true;
  }
}
