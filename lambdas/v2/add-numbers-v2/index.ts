import { Logger } from "@aws-lambda-powertools/logger";
import { parser } from "@aws-lambda-powertools/parser";
import { Tracer } from "@aws-lambda-powertools/tracer";
import type { LambdaInterface } from "@aws-lambda-powertools/commons/types";
import { APIGatewayProxyResult, Context } from "aws-lambda";
import { z } from "zod";
import { ApiGatewayEnvelope } from "@aws-lambda-powertools/parser/envelopes";
import { ParsedResult } from "@aws-lambda-powertools/parser/types";

const logger = new Logger();
const tracer = new Tracer();

const sumRequestSchema = z.object({
  num1: z.number(),
  num2: z.number(),
});

type SumRequest = z.infer<typeof sumRequestSchema>;

class Lambda implements LambdaInterface {
  @logger.injectLambdaContext({ logEvent: true })
  @tracer.captureLambdaHandler()
  @parser({
    schema: sumRequestSchema,
    envelope: ApiGatewayEnvelope,
    safeParse: true,
  })
  public async handler(
    event: ParsedResult<SumRequest>,
    _context: Context
  ): Promise<APIGatewayProxyResult> {
    if (event.success) {
      var validatedEvent = event.data as SumRequest;

      const num1 = validatedEvent.num1;
      const num2 = validatedEvent.num2;

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
    } else {
      logger.error(`--- Validation Error --- ${event.error.message} ---`);

      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Bad Request`,
          details: event.error.message,
        }),
      };
    }
  }
}

const addNumbersV2 = new Lambda();
export const handler = addNumbersV2.handler.bind(addNumbersV2);
