import { Aws, Duration } from "aws-cdk-lib";
import {
  Effect,
  IRole,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import {
  IFunction,
  Runtime,
  Tracing,
  Architecture,
  LayerVersion,
} from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";

export interface NodejsFunctionWithRoleProps {
  entry: string;
  environment?: { [key: string]: string };
  timeout?: Duration;
  memorySize?: number;
  retryAttempts?: number;
}

export class NodejsFunctionWithRole extends Construct {
  role: IRole;
  function: IFunction;

  constructor(
    scope: Construct,
    id: string,
    props: NodejsFunctionWithRoleProps
  ) {
    super(scope, id);

    this.role = new Role(this, "Role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    var managedLoggingPolicy = new ManagedPolicy(this, "FunctionBasePolicy", {
      statements: [
        new PolicyStatement({
          sid: "AllowCloudWatchLogs",
          effect: Effect.ALLOW,
          actions: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
          ],
          resources: ["*"],
        }),
        new PolicyStatement({
          sid: "AllowXRayAccess",
          effect: Effect.ALLOW,
          actions: [
            "xray:PutTraceSegments",
            "xray:PutTelemetryRecords",
            "xray:GetSamplingRules",
            "xray:GetSamplingTargets",
            "xray:GetSamplingStatisticSummaries",
          ],
          resources: ["*"],
        }),
      ],
    });

    // Add Cloudwatch Logging Permissions
    this.role.addManagedPolicy(managedLoggingPolicy);

    this.function = new NodejsFunction(this, "Function", {
      entry: props.entry,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.X86_64,
      role: this.role,
      tracing: Tracing.ACTIVE,
      timeout: props.timeout ?? Duration.seconds(4),
      memorySize: props.memorySize ?? 128,
      environment: {
        POWERTOOLS_SERVICE_NAME: id,
        POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: "true",
        POWERTOOLS_LOGGER_LOG_EVENT: "true",
        LOG_LEVEL: "INFO",
        ...props.environment,
      },
      layers: [
        LayerVersion.fromLayerVersionArn(
          this,
          "PowerToolsLayer",
          `arn:aws:lambda:${Aws.REGION}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:10`
        ),
      ],
      bundling: {
        minify: true,
        // Exclude @aws-sdk v3 since it's included in the NODEJS_20 runtime
        // Powertools will be provided via a layer
        externalModules: [
          "@aws-sdk/*",
          "@aws-lambda-powertools/logger",
          "@aws-lambda-powertools/tracer",
        ],
      },
    });

    NagSuppressions.addResourceSuppressions(
      this,
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "The Lambda Execution Role Policy needs to include a * permissions to enable Cloudwatch Logging and X-Ray Tracing.",
        },
      ],
      true
    );
  }
}
