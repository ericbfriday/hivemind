import balancer from "excess-energy-balancer";
import settings  from "@/settings-manager";
import StructureDestination from "@/dispatcher/resource-destination/structure";

interface PowerSpawnDestinationTask extends StructureDestinationTask {
  type: "powerSpawn";
  target: Id<StructurePowerSpawn>;
}

export default class PowerSpawnDestination extends StructureDestination<PowerSpawnDestinationTask> {
  constructor(readonly room: Room) {
    super(room);
  }

  getType(): "powerSpawn" {
    return "powerSpawn";
  }

  getHighestPriority() {
    return 3;
  }

  getTasks(context: ResourceDestinationContext) {
    if (this.room.isEvacuating()) return [];

    return this.cacheEmptyTaskListFor(context.resourceType || "", 25, () => {
      if (!balancer.maySpendEnergyOnPowerProcessing()) return [];

      const options: PowerSpawnDestinationTask[] = [];
      this.addResourceTask(RESOURCE_POWER, 0.9, options, context);

      if (
        this.room.getEffectiveAvailableEnergy() >=
        settings.get("minEnergyForPowerProcessing")
      ) {
        this.addResourceTask(RESOURCE_ENERGY, 0.2, options, context);
      }

      return options;
    });
  }

  addResourceTask(
    resourceType: RESOURCE_ENERGY | RESOURCE_POWER,
    minFreeLevel: number,
    options: PowerSpawnDestinationTask[],
    context: ResourceDestinationContext,
  ) {
    const powerSpawn = this.room.powerSpawn;
    if (!powerSpawn) return;

    const freeCapacity = powerSpawn.store.getFreeCapacity(resourceType);
    const capacity = powerSpawn.store.getCapacity(resourceType);
    if (freeCapacity < capacity * minFreeLevel) return;
    if (context.resourceType && context.resourceType !== resourceType) return;

    const option: PowerSpawnDestinationTask = {
      type: this.getType(),
      priority: 3,
      weight: freeCapacity / capacity,
      resourceType,
      amount: freeCapacity,
      target: powerSpawn.id,
    };

    option.priority -=
      this.room.getCreepsWithOrder(this.getType(), powerSpawn.id).length * 2;

    options.push(option);
  }
}
