import type ProcessInterface from 'process/process-interface';

declare global {
  export interface ProcessParameters {
    interval?: number
    priority?: number
    throttleAt?: number
    stopAt?: number
    requireSegments?: boolean
  }

  export interface RoomProcessParameters extends ProcessParameters {
    room: Room
  }
}

export class Process implements ProcessInterface {
  public readonly id: string;
  protected parameters: ProcessParameters;

  /**
   * Processes are run and managed by the hivemind kernel.
   * @constructor
   *
   * @param {ProcessParameters} parameters
   *   Options on how to run this process.
   */
  constructor(parameters: ProcessParameters) {
    this.parameters = parameters;
  }

  /**
   * Determines whether this process should run this tick.
   *
   * @return {boolean}
   *   Whether this process is allowed to run.
   */
  shouldRun(): boolean {
    return true;
  }

  /**
   * Runs the given process.
   */
  run() {
    console.error(`Trying to run a process \`${this.id}\` without implemented functionality.`);
  }
}

export default Process;
