package main

import (
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func Handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {

	cid := LockBalance(request.Body)

	payload, err := cid.MarshalJSON()
	if err != nil {
		log.Fatalf("error while parsing payload %s", err)
	}

	return events.APIGatewayProxyResponse{Body: string(payload), StatusCode: 200}, nil
}

func main() {
	lambda.Start(Handler)
}
