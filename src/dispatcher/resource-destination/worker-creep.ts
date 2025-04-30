import _ from "es-toolkit";
import TaskProvider from "dispatcher/task-provider";
import { ENEMY_STRENGTH_NORMAL } from "room-defense";

interface WorkerCreepDestinationTask extends ResourceDestinationTask {
  type: "workerCreep";
  target: Id<Creep>;
}

export default class WorkerCreepDestination extends TaskProvider<
  WorkerCreepDestinationTask,
  ResourceDestinationContext
> {
  constructor(readonly room: Room) {
    super();
  }

  getType(): "workerCreep" {
    return "workerCreep";
  }

  getHighestPriority() {
    return 2;
  }

  getTasks(context: ResourceDestinationContext) {
    if (context.resourceType && context.resourceType !== RESOURCE_ENERGY)
      return [];

    return this.cacheEmptyTaskListFor("", 25, () => {
      if (!this.shouldDeviverToCreeps()) return [];

      const options: WorkerCreepDestinationTask[] = [];

      const targetRoleWeights = {
        "builder.remote": 2,
        builder: 1.5,
        upgrader: 0.5,
      };

      for (const role in targetRoleWeights) {
        if (
          role !== "builder" &&
          this.room.defense.getEnemyStrength() > ENEMY_STRENGTH_NORMAL
        )
          continue;

        this.addRoleTasks(options, role, targetRoleWeights[role], context);
      }

      return options;
    });
  }

  private shouldDeviverToCreeps() {
    if (!this.room.storage && !this.room.terminal) return true;
    if (this.room.defense.getEnemyStrength() > ENEMY_STRENGTH_NORMAL)
      return true;

    return false;
  }

  private addRoleTasks(
    options: WorkerCreepDestinationTask[],
    role: string,
    weight: number,
    context: ResourceDestinationContext,
  ) {
    for (const creep of _.values<Creep>(this.room.creepsByRole[role])) {
      if (creep.spawning) continue;
      if (
        creep.store.getFreeCapacity(RESOURCE_ENERGY) <
        creep.store.getCapacity(RESOURCE_ENERGY) / 3
      )
        continue;

      options.push({
        type: "workerCreep",
        resourceType: RESOURCE_ENERGY,
        priority:
          2 - this.room.getCreepsWithOrder(this.getType(), creep.id).length * 3,
        weight:
          weight +
          Math.min(
            1,
            creep.store.getFreeCapacity(RESOURCE_ENERGY) /
              context.creep.store.getUsedCapacity(RESOURCE_ENERGY),
          ),
        target: creep.id,
        amount: context.creep.store.getUsedCapacity(RESOURCE_ENERGY),
      });
    }
  }

  isValid(
    task: WorkerCreepDestinationTask,
    context: ResourceDestinationContext,
  ) {
    const target = Game.getObjectById(task.target);
    if (!target) return false;
    if (target.spawning) return false;
    if (
      target.store.getFreeCapacity(task.resourceType) <
      target.store.getCapacity(RESOURCE_ENERGY) / 5
    )
      return false;
    if (target.room.name !== context.creep.room.name) return false;
    if (
      !context.ignoreStoreContent &&
      context.creep.store.getUsedCapacity(task.resourceType) === 0
    )
      return false;

    return true;
  }

  execute(
    task: WorkerCreepDestinationTask,
    context: ResourceDestinationContext,
  ) {
    const creep = context.creep;
    const target = Game.getObjectById(task.target);

    if (creep.store.getUsedCapacity(task.resourceType) === 0) {
      delete creep.memory.order;
      return;
    }

    creep.whenInRange(1, target, () => {
      if (task.amount) {
        creep.transfer(
          target,
          task.resourceType,
          Math.min(
            task.amount,
            creep.store.getUsedCapacity(task.resourceType),
            target.store.getFreeCapacity(task.resourceType),
          ),
        );
      } else {
        creep.transfer(target, task.resourceType);
      }

      delete creep.memory.order;
    });
  }
}
