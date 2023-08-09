package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

const (
	DevelopmentEnv = "dev"
	StagingEnv     = "staging"
	ProductionEnv  = "production"

	DevelopmentUrl = "http://localhost:3000"
	StagingUrl     = "https://dev-crypto-ops.vercel.app"
	ProductionUrl  = "https://transfer.protocol.ai"

	EnvFlag      = "env"
  APIAuthToken = "eyJhbGciOiJIUzI1NiJ9.Y29udHJvbGxlcl9zY3JpcHQ.K7bX27HDGxmBee5Gxx8DxDF07cDdw4oTQ90GbJS8Ih8"
)

type Payload struct {
	Transactions []string `json:"transactions"`
}

type Parameters struct {
	Env       string
	AuthToken string
}

func main() {
	parameters, err := parseParameters()
	if err != nil {
		fmt.Println("error parsing parameters: ", err.Error())
		os.Exit(1)
	}

	envURL, err := getEnvURL(parameters.Env)
	if err != nil {
		fmt.Println("error parsing environment url: ", err.Error())
		os.Exit(1)
	}

	args, err := readPipedArgs()
	if err != nil {
		fmt.Println("error parsing piped arguments: ", err.Error())
		os.Exit(1)
	}

	requestPayload, transactionArray, err := createRequestPayload(args)
	if err != nil {
		fmt.Println("error creating request payload: ", err.Error())
		os.Exit(1)
	}

	apiURL := fmt.Sprintf("%s/api/script-transactions?auth_token=%s", envURL, APIAuthToken)
	response, err := http.Post(apiURL, "application/json", bytes.NewReader(requestPayload))
	if err != nil {
		fmt.Println("error posting transactions: ", err.Error())
		os.Exit(1)
	}

	if response.StatusCode != http.StatusOK {
		fmt.Println("request failed with status: ", response.Status)
		os.Exit(1)
	}

	fmt.Println("Message IDs sent:")
	fmt.Print(strings.Join(transactionArray, "\n"))
}

func parseParameters() (*Parameters, error) {
	envParameter := flag.String(EnvFlag, DevelopmentEnv, "script target environment")
  flag.Parse()

	if envParameter == nil {
		return nil, errors.New("missing environment parameter")
	}

	parameters := &Parameters{
		Env:       *envParameter,
	}
	return parameters, nil
}

func getEnvURL(env string) (string, error) {
	switch env {
	case DevelopmentEnv:
		return DevelopmentUrl, nil
	case StagingEnv:
		return StagingUrl, nil
	case ProductionEnv:
		return ProductionUrl, nil
	default:
		return "", errors.New("environment not found")
	}
}

func readPipedArgs() ([]rune, error) {
	reader := bufio.NewReader(os.Stdin)
	var output []rune

	for {
		input, _, err := reader.ReadRune()
		if err != nil && err == io.EOF {
			break
		}
		output = append(output, input)
	}

	return output, nil
}

func createRequestPayload(args []rune) ([]byte, []string, error) {
	stringOutput := string(args)
	transactionArray := strings.Split(stringOutput, "\n")

	var parsedTransactionArray []string
	for _, transaction := range transactionArray {
		if len(transaction) > 0 {
			parsedTransactionArray = append(parsedTransactionArray, transaction)
		}
	}

	if len(parsedTransactionArray) <= 0 {
		return nil, nil, errors.New("there are no transactions to send")
	}

	requestPayload := Payload{Transactions: parsedTransactionArray}
	jsonPayload, err := json.Marshal(requestPayload)
	return jsonPayload, parsedTransactionArray, err
}
