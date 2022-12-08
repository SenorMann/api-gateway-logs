import { APIGatewayEvent, Context } from 'aws-lambda';
import express from "express";
import serverless from 'serverless-http';

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {  message: "Hello there, buddy!"  }
  });
});

app.post("/", (req, res) => {
  console.log(req.body);
  res.json({
    success: true,
    message: "Response from POST route."
  });
})

const handler = serverless(app, { binary: ['image/*', 'font/*'] });

export async function main(event: APIGatewayEvent, context: Context) {
  try {
    const response = await handler(event, context);
    console.log(response);
    return response;
  } catch (err: any) {
    console.error(err);
    return {
      body: JSON.stringify({ message: err.message || 'Internal server error' }),
      headers: { 'content-type': 'application/json' },
      statusCode: 500,
    };
  }
}
