interface Memory {
  profiler: ProfilerMemory
}

export interface ProfilerMemory {
  data: { [name: string]: ProfilerData }
  start?: number
  total: number
}

export interface ProfilerData {
  calls: number
  time: number
}

export interface Profiler {
  clear: () => string
  output: () => string
  start: () => string
  status: () => string
  stop: () => string
  toString: () => string
}

declare const __PROFILER_ENABLED__: boolean;
