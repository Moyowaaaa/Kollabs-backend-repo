import morgan, { type StreamOptions } from "morgan";
import logger from "./winston.log";

const stream: StreamOptions = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

const httpLogger = morgan(
  ":method :url :status :response-time ms - :res [content-length]",
  { stream }
);

export default httpLogger;
