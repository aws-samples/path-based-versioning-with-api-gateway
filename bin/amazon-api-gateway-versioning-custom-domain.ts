#!/usr/bin/env node
import "source-map-support/register";
import { AwsSolutionsChecks } from "cdk-nag";
import { App, Aspects } from "aws-cdk-lib";
import { ApiStackV1 } from "../lib/apiStackV1";
import { ApiStackV2 } from "../lib/apiStackV2";
import { CustomDomainRouterStack } from "../lib/customDomainRouterStack";

const app = new App();
const customDomainRouterStack = new CustomDomainRouterStack(
  app,
  "CustomDomainRouterStack"
);
new ApiStackV1(app, "ApiStackV1", {
  customDomainName: customDomainRouterStack.apiGatewayCustomDomainName,
});
new ApiStackV2(app, "ApiStackV2", {
  customDomainName: customDomainRouterStack.apiGatewayCustomDomainName,
});

// Aspects.of(app).add(new AwsSolutionsChecks());
