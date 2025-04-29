import Operation from 'operation/operation';

export default RoomOperation;
export class RoomOperation extends Operation {
    constructor(name) {
        super(name);
        this.memory.type = 'room';
    }
}
