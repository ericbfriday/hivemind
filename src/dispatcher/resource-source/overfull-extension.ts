import StructureSource from '@/dispatcher/resource-source/structure';

export interface OverfullExtensionSourceTask extends StructureSourceTask {
  type: 'overfullExtension'
  target: Id<StructureExtension>
}

export default OverfullExtensionSource;
export class OverfullExtensionSource extends StructureSource<OverfullExtensionSourceTask> {
  constructor(readonly room: Room) {
    super(room);
  }

  getType(): 'overfullExtension' {
    return 'overfullExtension';
  }

  getHighestPriority() {
    return 5;
  }

  getTasks(context: ResourceSourceContext) {
    if (context.resourceType && context.resourceType !== RESOURCE_ENERGY) {
      return [];
    }

    return this.cacheEmptyTaskListFor('', 1500, () => {
      const options: OverfullExtensionSourceTask[] = [];

      for (const extension of this.room.structuresByType[STRUCTURE_EXTENSION] || []) {
        const capacity = extension.isOperational() ? extension.store.getCapacity(RESOURCE_ENERGY) : 0;
        if (extension.store.getUsedCapacity(RESOURCE_ENERGY) <= capacity) {
          continue;
        }

        const option: OverfullExtensionSourceTask = {
          priority: 5,
          weight: 1 - (context.creep.pos.getRangeTo(extension) / 100) - (extension.isOperational() ? 0 : 0.5),
          type: this.getType(),
          target: extension.id,
          resourceType: RESOURCE_ENERGY,
          amount: extension.store.getUsedCapacity(RESOURCE_ENERGY) - extension.store.getUsedCapacity(RESOURCE_ENERGY),
        };

        option.priority -= this.room.getCreepsWithOrder(this.getType(), extension.id).length * 2;

        options.push(option);
      }

      return options;
    });
  }
}
