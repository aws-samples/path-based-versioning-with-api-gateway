import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import type { LambdaInterface } from "@aws-lambda-powertools/commons/types";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

const logger = new Logger();
const tracer = new Tracer();

class Lambda implements LambdaInterface {
  @logger.injectLambdaContext({ logEvent: true })
  @tracer.captureLambdaHandler()
  public async handler(
    event: APIGatewayProxyEvent,
    _context: Context
  ): Promise<APIGatewayProxyResult> {
    var body = JSON.parse(event.body ?? "");

    const num1 = body.num1;
    const num2 = body.num2;

    logger.info(
      `--- SumRequest received --- num1: ${num1} --- num2: ${num2} ---`
    );

    const sumResult = num1 + num2;

    logger.debug(`--- Calculation result: ${sumResult} ---`);

    const apiResponse = {
      result: sumResult,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(apiResponse),
    };
  }
}

const addNumbersV1 = new Lambda();
export const handler = addNumbersV1.handler.bind(addNumbersV1);
