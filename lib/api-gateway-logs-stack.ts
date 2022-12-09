import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ApiGateway from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';


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

    new LogGroup(this, "lambda-log-group", {
      logGroupName: `/aws/lambda/${handler.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });

    // const apiLogs = new LogGroup(this, "api-access-logs", {
    //   removalPolicy: RemovalPolicy.DESTROY,
    //   retention: RetentionDays.ONE_DAY,
    // })

    const api = new ApiGateway.RestApi(this, "api", {
      deployOptions: {
        dataTraceEnabled: true,
        // accessLogDestination: new ApiGateway.LogGroupLogDestination(apiLogs),
        // accessLogFormat: ApiGateway.AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: ApiGateway.MethodLoggingLevel.INFO
      }
    });

    api.root.addProxy({ defaultIntegration: new ApiGateway.LambdaIntegration(handler) })
    const apiExecutionLogGroup = LogGroup.fromLogGroupName(
      this,
      "api-execution-log-group",
      `API-Gateway-Execution-Logs_${api.restApiId}/${api.deploymentStage.stageName}`
    )

    apiExecutionLogGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // new LogGroup(this, "api-log-group", {
    //   logGroupName: `API-Gateway-Execution-Logs_${api.restApiId}/${api.deploymentStage.stageName}`,
    //   removalPolicy: RemovalPolicy.DESTROY,
    //   retention: RetentionDays.ONE_DAY
    // });


    new cdk.CfnOutput(this, 'API Gateway URL', {
      value: api.url as string,
    });
  }
}
