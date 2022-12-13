import * as cdk from 'aws-cdk-lib';
import { CfnResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as ApiGateway from "aws-cdk-lib/aws-apigateway";
import { CfnRole, Effect, Policy, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { Runtime } from "aws-cdk-lib/aws-lambda";
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
        accessLogDestination: new ApiGateway.LogGroupLogDestination(new LogGroup(this, "api-access-logs", {
          removalPolicy: RemovalPolicy.DESTROY,
          retention: RetentionDays.FIVE_DAYS,
        })),
        accessLogFormat: ApiGateway.AccessLogFormat.jsonWithStandardFields()
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
      if (construct.node.id === "LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a") {
        const role = construct.node.findChild("ServiceRole") as Role;

        role.addToPolicy(new PolicyStatement({
          actions: ['logs:CreatLogGroup'],
          resources: ['*'],
          effect: Effect.DENY,
        }));

      }
    })
  }
}
