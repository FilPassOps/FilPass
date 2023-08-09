package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/filecoin-project/go-state-types/big"
	"github.com/ipfs/go-cid"

	"github.com/filecoin-project/go-state-types/abi"

	"github.com/filecoin-project/go-address"

	msig2 "github.com/filecoin-project/specs-actors/v2/actors/builtin/multisig"

	jsonrpc "github.com/filecoin-project/go-jsonrpc"
	"github.com/filecoin-project/lotus/api/v0api"
	"github.com/filecoin-project/lotus/chain/actors"
	"github.com/filecoin-project/lotus/chain/actors/builtin/multisig"
	"github.com/filecoin-project/lotus/chain/types"
)

type LockBalanceRequest struct {
	MultisigAddress  string
	RecipientAddress string
	Amount           string
	StartEpoch       string
	Duration         string
}

func LockBalance(body string) *cid.Cid {
	var lockRequest LockBalanceRequest

	err := json.Unmarshal([]byte(body), &lockRequest)
	if err != nil {
		log.Fatalf("error while parsing body %s", err)
	}

	authToken := os.Getenv("LOTUS_NODE_AUTH")
	addr := os.Getenv("LOTUS_NODE_ADDRESS")
	headers := http.Header{"Authorization": []string{"Bearer " + authToken}}
	ctx := context.Background()

	log.Println("Creating client")

	var api v0api.FullNodeStruct
	closer, err := jsonrpc.NewMergeClient(ctx, "ws://"+addr+"/rpc/v0", "Filecoin", []interface{}{&api.Internal}, headers, jsonrpc.WithTimeout(120*time.Second))

	if err != nil {
		log.Fatalf("connecting with lotus failed: %s", err)
	}

	defer closer()

	log.Println("Parsing addresses")
	msig, err := address.NewFromString(lockRequest.MultisigAddress)
	if err != nil {
		log.Fatalf("error while parsing %s", err)
	}

	from, err := address.NewFromString(lockRequest.RecipientAddress)
	if err != nil {
		log.Fatalf("error while parsing %s", err)
	}

	log.Println("Parse amount")
	amount, err := types.ParseFIL(lockRequest.Amount)
	if err != nil {
		log.Fatalf("error while parsing fil %s", err)
	}

	starEpoch, _ := strconv.Atoi(lockRequest.StartEpoch)
	duration, _ := strconv.Atoi(lockRequest.Duration)

	var blocksInADay = (24 * 60 * 60) / 30
	var blocksInAMonth = (blocksInADay * 365) / 12

	log.Println("Serializing params")
	params, actErr := actors.SerializeParams(&msig2.LockBalanceParams{
		StartEpoch:     abi.ChainEpoch(starEpoch),
		UnlockDuration: abi.ChainEpoch(duration * blocksInAMonth),
		Amount:         big.Int(amount),
	})

	if actErr != nil {
		log.Fatalf("error while parsing params %s", actErr)
	}

	log.Println("Calling propose")

	proto, protoErr := api.MsigPropose(ctx, msig, msig, big.Zero(), from, uint64(multisig.Methods.LockBalance), params)

	log.Println("created proto")

	if protoErr != nil {
		log.Fatalf("error while creating msig propose %s", protoErr)
	}
	return &proto
}
