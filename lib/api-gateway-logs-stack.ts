import * as cdk from 'aws-cdk-lib';
import { CfnResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as ApiGateway from "aws-cdk-lib/aws-apigateway";
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
        dataTraceEnabled: true,
        loggingLevel: ApiGateway.MethodLoggingLevel.INFO,
      },
    });

    api.root.addProxy();

    const lg = new LogRetention(this, "log-retention", {
      logGroupName: `API-Gateway-Execution-Logs_${api.restApiId}/${api.deploymentStage.stageName}`,
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
      logRetentionRetryOptions: {},
    });


    lg.node.defaultChild?.node.findAll().forEach((construct) => {
      console.log(`HEY: ${this.resolve((construct as CfnResource).logicalId)}`)
      console.log(`TYPE: ${(construct as CfnResource).cfnResourceType}`)
    })

    // console.log(`HEY: ${this.resolve((lg.node.defaultChild as CfnResource).logicalId)}`)

    // new LogGroup(this, "log-retention-log-group", {
    //   logGroupName: `/aws/lambda/${(lg.node.defaultChild as CfnResource).logicalId}}`,
    //   retention: RetentionDays.ONE_DAY,
    //   removalPolicy: RemovalPolicy.DESTROY,
    // })

    new LogGroup(this, "lambda-log-group", {
      logGroupName: `/aws/lambda/${handler.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });

    new cdk.CfnOutput(this, 'API Gateway URL', {
      value: api.url as string,
    });
  }
}
