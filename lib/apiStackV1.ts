import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
  IDomainName,
  LambdaRestApi,
  LogGroupLogDestination,
  MethodLoggingLevel,
} from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { NodejsFunctionWithRole } from "./constructs/nodejsFunctionWithRole";
import path = require("path");
import { CfnApiMapping } from "aws-cdk-lib/aws-apigatewayv2";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { NagSuppressions } from "cdk-nag";

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

    const accessLogGroup = new LogGroup(this, "V1AccessLogs", {
      retention: 90,
    });

    this.lambdaRestApi = new LambdaRestApi(this, "LambdaRestApiV1", {
      handler: addNumbersV1.function,
      deployOptions: {
        stageName: "api",
        tracingEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
        accessLogDestination: new LogGroupLogDestination(accessLogGroup),
        metricsEnabled: true,
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

    NagSuppressions.addResourceSuppressions(
      this.lambdaRestApi,
      [
        {
          id: "AwsSolutions-APIG2",
          reason:
            "Request Validation is handled by the Backend Lambda function.",
        },
        {
          id: "AwsSolutions-APIG3",
          reason:
            "This API does not implement a WAF Firewall integration as it is used for demo sample implementation purposes only. Adding a firewall would add complexity to the sample proof of concept exercise. Consider adding an AWS WAF Firewall integration before using Amazon API Gateway in a production use-case.",
        },
        {
          id: "AwsSolutions-APIG4",
          reason:
            "This API does not implement authorization as it is used for demo sample implementation purposes only. Adding authorization would add complexity to the sample proof of concept exercise. Ensure authorization is implemented before using Amazon API Gateway in a production use-case.",
        },
        {
          id: "AwsSolutions-COG4",
          reason:
            "This API does not implement authorization as it is used for demo sample implementation purposes only. Adding authorization would add complexity to the sample proof of concept exercise. Ensure authorization is implemented before using Amazon API Gateway in a production use-case.",
        },
      ],
      true
    );

    new CfnOutput(this, "ApiV1URL", {
      value: `https://${this.lambdaRestApi.url}`,
    });
  }
}
