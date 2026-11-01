.PHONY: build test lint fmt fmt-check coverage contract ci dev

build:
	npm run build

test:
	npm run test

lint:
	npm run lint

fmt:
	npm run fmt

fmt-check:
	npm run fmt:check

coverage:
	npm run coverage

contract:
	npm run contract

ci:
	npm run ci

dev:
	npm run dev
