#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { ApiGatewayLogsStack } from '../lib/api-gateway-logs-stack';

const app = new cdk.App();
new ApiGatewayLogsStack(app, 'ApiGatewayLogsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
});

// class LogRemover implements IAspect {
//   public visit(construct: IConstruct): void {
//     if (construct instanceof LogRetention) {
//       const child = construct.node.findChild("Resource") as CfnResource;
//       console.log("TYPE: " + child.cfnResourceType);
//     }
//   }
// }

// Aspects.of(app).add(new LogRemover());