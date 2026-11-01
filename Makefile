.PHONY: build test lint fmt fmt-check coverage contract ci dev

build:
	bun run build

test:
	bun run test

lint:
	bun run lint

fmt:
	bun run fmt

fmt-check:
	bun run fmt:check

coverage:
	bun run coverage

contract:
	bun run contract

ci:
	bun run ci

dev:
	bun run dev
