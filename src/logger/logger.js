import path from "path";
import { fileURLToPath } from 'url';
import { format, createLogger, transports} from 'winston';


const DIRNAME = path.dirname(fileURLToPath(import.meta.url));


function buildLogger() {
    const logFormat = format.printf(({ level, message, timestamp, stack}) => {
        return `${timestamp} | ${level} | ${stack || message}`;
    })
    
    return createLogger({
        level: 'debug',
        format: format.combine(
            format.colorize(),
            format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
            format.errors({stask: true}),
            logFormat),
        transports: [
            new transports.Console(),
            new transports.File({
                filename: `${DIRNAME}/botlog.log`,
                level: 'debug'
            })
        ]
    });
}


export const logger = buildLogger();
