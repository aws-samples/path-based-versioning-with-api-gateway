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

export interface ApiStackV2StackProps extends StackProps {
  customDomainName: IDomainName;
}

export class ApiStackV2 extends Stack {
  lambdaRestApi: LambdaRestApi;

  constructor(scope: Construct, id: string, props: ApiStackV2StackProps) {
    super(scope, id);

    const addNumbersV2 = new NodejsFunctionWithRole(this, "AddNumbersV2", {
      entry: `${path.resolve(__dirname)}/../lambdas/v2/add-numbers-v2/index.ts`,
      environment: {},
    });

    this.lambdaRestApi = new LambdaRestApi(this, "LambdaRestApiV2", {
      handler: addNumbersV2.function,
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
      apiMappingKey: "api/v2",
    });

    apiMapping.node.addDependency(this.lambdaRestApi);

    new CfnOutput(this, "ApiV2URL", {
      value: `https://${this.lambdaRestApi.url}`,
    });
  }
}
