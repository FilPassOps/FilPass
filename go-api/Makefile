.PHONY: build clean deploy

build:
	env GOARCH=amd64 GOOS=linux go build -ldflags="-s -w" -o ./bin/lotus-client

clean:
	rm -rf ./bin ./vendor Gopkg.lock

deploy: clean build
	sls deploy -s ${stage}