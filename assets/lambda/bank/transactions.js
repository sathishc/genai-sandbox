import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = process.env.BANK_TABLE_NAME;

export const handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  console.log("Event details", event);
  
  const apiPath= event['apiPath'];
  console.log("API path", apiPath);

  try {
    switch (apiPath) {
      case "/transactions/{customerId}":
        const customerId = getNamedParameter(event, "customerId");
        console.log("Customer ID", customerId);
        body = await getTransactionsForCustomer(customerId);
        console.log("Txns for customer", body);
        body = body.Items;
        break;
      case "/transactions/{all}":
        body = await getAllTransactions();
        console.log("All txns", body);
        body = body.Items;
        break;
      case "/transactions/{location}":
          const location = getNamedParameter(event, "location");
          body = await getTransactionByLocation(location);
          console.log("Txn by location", body);
          body = body.Items;
          break;
      case "/transactions/{between_dates}":
        const startDate = getNamedParameter(event, "start_date");
        const endDate = getNamedParameter(event, "end_date");
        body = await getTransactionBetweenDates(startDate, endDate);
        console.log("Txn between dates", body);
        body = body.Items;
        break;    
      case "/account_balance/{customer_id}":
          const customer_Id = getNamedParameter(event, "customerId");
          body = await getAccountBalanceForCustomer(customer_Id)
          console.log("Account balance", body);
          body = body.CustAccountBalance;
          break;          
      default:
        throw new Error(`Unsupported route: "${event.apiPath}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  console.log("Returning response", body);

  action_response = {
    'actionGroup': event['actionGroup'],
    'apiPath': event['apiPath'],
    'httpMethod': event['httpMethod'],
    'httpStatusCode': 200,
    'responseBody': { 'application/json': {
      'body': body
      } 
    }
  }

  return {'response': action_response};
};

function getNamedParameter(event, name) {
  for (const [key, value] of Object.entries(event.parameters)) {
    console.log("Key", key);
    console.log("Value", value);
    if (value.name === name) {
      return value.value;
    }
  }
}

async function getTransactionsForCustomer(customerId) {
  return client.send(
    new QueryCommand({
      TableName: tableName,
      ProjectionExpression: "#transactionId, #customerId, #transactionAmount, #transactionDate",
      KeyConditionExpression: "CustomerID = :customerId",
      ExpressionAttributeNames: {
        "#transactionAmount": "TransactionAmount (INR)",
        "#transactionDate": "TransactionDate",
        "#transactionId": "TransactionID",
        "#customerId": "CustomerID"
      },
      ExpressionAttributeValues: {
        ":customerId": customerId,
      }
    })
  );
}

async function getAllTransactions() {
  return dynamo.send(
    new ScanCommand({ 
      TableName: tableName,
      Limit: 10,
      AttributesToGet: ["TransactionId", "CustomerID", "Amount"], 
    })
  );
}

async function getTransactionByLocation(location) {
  return dynamo.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: "CustLocation = :location",
      ExpressionAttributeValues: {
        ":location": location,
      }
    })
  );
}

async function getTransactionBetweenDates(startDate, endDate) {
  return dynamo.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: "TransactionDate BETWEEN :startDate AND :endDate",
      ExpressionAttributeValues: {
        ":startDate": startDate,
        ":endDate": endDate,
      }
    })
  );
}

async function getAccountBalanceForCustomer(customerId) {
  const transactions = await dynamo.send(
    new QueryCommand({
      TableName: tableName,
      ProjectionExpression: "TransactionID, CustAccountBalance, TransactionDate",
      KeyConditionExpression: "CustomerID = :customerId",
      ExpressionAttributeValues: {
        ":customerId": customerId,
      }
    })
  );

  return transactions.Items.reduce((a, b) => (new Date(a.TransactionDate) > new Date(b.TransactionDate) ? a : b));
}
  





