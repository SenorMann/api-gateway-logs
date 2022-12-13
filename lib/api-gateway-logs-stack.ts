import * as cdk from 'aws-cdk-lib';
import { CfnResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as ApiGateway from "aws-cdk-lib/aws-apigateway";
import { CfnFunction, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, LogRetention, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from "path";

export class ApiGatewayLogsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const handler = new NodejsFunction(this, "handler", {
      bundling: { minify: true },
      entry: path.resolve(__dirname, "../handlers", "index.ts"),
      handler: "main",
      memorySize: 256,
      runtime: Runtime.NODEJS_16_X,
      timeout: Duration.seconds(15),
    });

    const api = new ApiGateway.RestApi(this, "api", {
      defaultIntegration: new ApiGateway.LambdaIntegration(handler),
      deployOptions: {
        dataTraceEnabled: true,
        loggingLevel: ApiGateway.MethodLoggingLevel.INFO,
      },
    });

    api.root.addProxy();

    new LogRetention(this, "log-retention", {
      logGroupName: `API-Gateway-Execution-Logs_${api.restApiId}/${api.deploymentStage.stageName}`,
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
      logRetentionRetryOptions: {},
    });

    new LogGroup(this, "lambda-log-group", {
      logGroupName: `/aws/lambda/${handler.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });

    new cdk.CfnOutput(this, 'API Gateway URL', {
      value: api.url as string,
    });

    this.node.findAll().forEach((construct) => {
      if (construct instanceof CfnFunction) {
        const functionId = this.resolve(construct.logicalId) as string;
        console.log(`Function Id: ${this.resolve(construct.logicalId)}`);

        if (functionId.startsWith("LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a")) {
          console.log("FOUND YOU!!!!");
          console.log("HEY" + this.resolve(construct.getAtt("FunctionName")))
        } 
      }
    })
  }
}
