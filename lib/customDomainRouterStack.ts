import { CfnOutput, CfnParameter, Stack, StackProps } from "aws-cdk-lib";
import {
  DomainName,
  EndpointType,
  IDomainName,
} from "aws-cdk-lib/aws-apigateway";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { Construct } from "constructs";

export class CustomDomainRouterStack extends Stack {
  apiGatewayCustomDomainName: IDomainName;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const prerequisiteDomainName = new CfnParameter(
      this,
      "PrerequisiteDomainName",
      {
        type: "String",
        description: "A domain name that you own.",
      }
    );

    const domainNameValue = `demo.api-gateway-custom-domain-versioning.${prerequisiteDomainName.valueAsString}`;

    const certificate = new Certificate(this, "Certificate", {
      domainName: domainNameValue,
      validation: CertificateValidation.fromDns(),
    });

    this.apiGatewayCustomDomainName = new DomainName(this, "DomainName", {
      certificate: certificate,
      endpointType: EndpointType.REGIONAL,
      domainName: domainNameValue,
      basePath: "api",
    });

    new CfnOutput(this, "ApiGatewayCustomDomainName", {
      value: `https://${domainNameValue}/api`,
    });
  }
}
