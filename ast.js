export class Diagnostic extends Error {
    offset;
    constructor(message, offset){
        super(message + (offset === undefined ? '' : ` at offset ${offset}`));
        this.name = 'EinsteinError';
        this.offset = offset;
    }
}
