export class ConsoleLogger {
    info(message, meta) {
        console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
    }
    warn(message, meta) {
        console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
    }
    error(message, error) {
        console.error(`[ERROR] ${message}`, error);
    }
    debug(message, meta) {
        console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
    }
}
//# sourceMappingURL=Logger.js.map