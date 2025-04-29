let callTimes: Record<string, number[]> = {};
let firstTick = Game.time;

export interface CallStats {
    average: number
    maximum: number
    count: number
}

function timeCall<T>(key: string, callback: () => T): number {
    const startTime = Game.cpu.getUsed();
    callback();
    const totalTime = Game.cpu.getUsed() - startTime;
    recordCallStats(key, totalTime);

    return totalTime;
}

function recordCallStats(key: string, totalTime: number) {
    if (Game.time - firstTick > 1000) {
        firstTick = Game.time;
        callTimes = {};
    }

    if (!callTimes[key]) {
        callTimes[key] = [];
    }

    callTimes[key].push(totalTime);
}

function getElapsedTicks() {
    return Game.time - firstTick;
}

function getCallStats(prefix?: string) {
    const stats: Record<string, CallStats> = {};
    for (const key in callTimes) {
        if (prefix && !key.startsWith(prefix)) {
            continue;
        }

        stats[key] = generateCallStats(key);
    }

    return stats;
}

function generateCallStats(key: string): CallStats {
    let maximum: number;
    let sum = 0;

    for (const record of callTimes[key]) {
        sum += record;

        if (!maximum || maximum < record) {
            maximum = record;
        }
    }

    return {
        average: sum / callTimes[key].length,
        maximum,
        count: callTimes[key].length,
    };
}

export {
    getCallStats,
    getElapsedTicks,
    timeCall,
};
