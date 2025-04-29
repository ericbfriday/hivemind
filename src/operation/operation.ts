import _ from "lodash";
import RemoteMiningOperation from "operation/remote-mining";
import RoomOperation from "operation/room";

declare global {
  interface Creep {
    operation?: Operation;
  }

  interface Memory {
    operations: Record<string, OperationMemory>;
  }

  interface CreepMemory {
    operation?: string;
  }

  interface TypedOperationsList {
    mining: Record<string, RemoteMiningOperation>;
    room: Record<string, RoomOperation>;
  }

  interface Game {
    operations: Record<string, Operation>;
    operationsByType: Partial<TypedOperationsList>;
  }

  interface OperationMemory {
    type: string;
    lastActive: number;
    roomName?: string;
    shouldTerminate?: boolean;
    currentTick: number;
    statTicks: number;
    age: number;
    stats: Record<string, number>;
  }

  interface DefaultOperationMemory extends OperationMemory {
    type: "default";
  }
}

export default class Operation {
  protected roomName?: string;
  protected memory: OperationMemory;

  public constructor(readonly name: string) {
    if (!Memory.operations) Memory.operations = {};
    if (!Memory.operations[name])
      Memory.operations[name] = {} as OperationMemory;

    this.memory = Memory.operations[name];
    this.memory.type = "default";
    this.memory.lastActive = Game.time;

    if (this.memory.roomName) {
      this.roomName = this.memory.roomName;
    }

    if (!this.memory.stats) this.memory.stats = {};
  }

  public getType(): string {
    return this.memory.type || "default";
  }

  public setRoom(roomName: string) {
    this.memory.roomName = roomName;
    this.roomName = roomName;
  }

  public getRoom(): string {
    return this.roomName;
  }

  public getAge(): number {
    return this.memory.age || 0;
  }

  public getLastActiveTick(): number {
    return Math.min(
      this.memory.lastActive || Game.time,
      this.memory.currentTick || Game.time,
    );
  }

  public terminate() {
    this.memory.shouldTerminate = true;
    this.onTerminate();
  }

  public onTerminate() {
    // This space intentionally left blank.
  }

  public addCpuCost(amount: number) {
    this.recordStatChange(amount, "cpu");
  }

  public addResourceCost(amount: number, resourceType: string) {
    this.recordStatChange(-amount, resourceType);
  }

  public addResourceGain(amount: number, resourceType: string) {
    this.recordStatChange(amount, resourceType);
  }

  private recordStatChange(amount: number, resourceType: string) {
    if (this.memory.currentTick !== Game.time) {
      this.memory.currentTick = Game.time;
      this.memory.statTicks = (this.memory.statTicks || 0) + 1;
      this.memory.age = (this.memory.age || this.memory.statTicks - 1) + 1;

      this.squashStats();
    }

    this.memory.stats[resourceType] =
      (this.memory.stats[resourceType] || 0) + amount;
  }

  private squashStats() {
    if (this.memory.statTicks < 10_000) return;
    const squashFactor = 2;

    this.memory.statTicks = Math.floor(this.memory.statTicks / squashFactor);
    for (const resourceType in this.memory.stats) {
      this.memory.stats[resourceType] /= squashFactor;
    }
  }

  public getStat(resourceType: string): number {
    return (
      (this.memory.stats[resourceType] || 0) / (this.memory.statTicks || 1)
    );
  }
}
