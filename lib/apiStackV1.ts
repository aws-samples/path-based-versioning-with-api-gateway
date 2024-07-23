import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
  IDomainName,
  LambdaRestApi,
  MethodLoggingLevel,
} from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { NodejsFunctionWithRole } from "./constructs/nodejsFunctionWithRole";
import path = require("path");
import { CfnApiMapping } from "aws-cdk-lib/aws-apigatewayv2";

export interface ApiStackV1StackProps extends StackProps {
  customDomainName: IDomainName;
}

export class ApiStackV1 extends Stack {
  lambdaRestApi: LambdaRestApi;

  constructor(scope: Construct, id: string, props: ApiStackV1StackProps) {
    super(scope, id);

    const addNumbersV1 = new NodejsFunctionWithRole(this, "AddNumbersV1", {
      entry: `${path.resolve(__dirname)}/../lambdas/v1/add-numbers-v1/index.ts`,
      environment: {},
    });

    this.lambdaRestApi = new LambdaRestApi(this, "LambdaRestApiV1", {
      handler: addNumbersV1.function,
      deployOptions: {
        stageName: "api",
        tracingEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
      },
      proxy: true,
    });

    var apiMapping = new CfnApiMapping(this, "ApiMapping", {
      apiId: this.lambdaRestApi.restApiId,
      domainName: props.customDomainName.domainName,
      stage: "api",
      apiMappingKey: "api/v1",
    });

    apiMapping.node.addDependency(this.lambdaRestApi);

    new CfnOutput(this, "ApiV1URL", {
      value: `https://${this.lambdaRestApi.url}`,
    });
  }
}
