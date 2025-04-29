declare global {
    export interface CostMatrix {
        render: (roomName?: string, asVisual?: boolean) => string
    }
}

/**
 * Outputs a cost matrix as a table for console output.
 */
PathFinder.CostMatrix.prototype.render = function (this: CostMatrix, roomName?: string, asVisual?: boolean): string {
    const terrain = roomName && Game.map.getRoomTerrain(roomName);
    const visual = roomName && asVisual && Game.rooms[roomName]?.visual;

    let output = '<table style="display: inline-block">';
    for (let y = 0; y < 50; y++) {
        output += '<tr style="height: 2px">';
        for (let x = 0; x < 50; x++) {
            let value = this.get(x, y);
            if (value === 0 && roomName) {
                // Simulate fallback to room terrain values.
                if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
                    value = 255;
                }
                else if (terrain.get(x, y) === TERRAIN_MASK_SWAMP) {
                    value = 10;
                }
                else {
                    value = 2;
                }
            }

            // Generate color gradient for matrix values of 1-99.
            let color = 'gray';
            if (value >= 100) {
                color = 'black';
            }
            else if (value >= 75) {
                color = `rgb(${Math.round(255 * (1 - (value - 75) / 25))}, 0, 255)`;
            }
            else if (value >= 50) {
                color = `rgb(255, 0, ${Math.round(255 * (value - 50) / 25)})`;
            }
            else if (value >= 25) {
                color = `rgb(255, ${Math.round(255 * (1 - (value - 25) / 25))}, 0)`;
            }
            else if (value > 0) {
                color = `rgb(${Math.round(255 * value / 25)}, 255, 0)`;
            }

            if (visual) {
                visual.rect(x - 0.4, y - 0.4, 0.8, 0.8, {
                    fill: color,
                    opacity: 0.5,
                });
            }

            output += `<td style="width: 2px; background: ${color}"></td>`;
        }

        output += '</tr>';
    }

    output += '</table>';
    return output;
};

export { };
