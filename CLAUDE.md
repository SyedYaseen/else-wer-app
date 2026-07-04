# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Else-wer-app is a audiobook player app using react native that for self hosted audiobook server.
Server: /home/loop/p/else-wer/else-wer-server

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Coding Guidelines

- Ask for clarification if requirements are ambiguous.
- Minimize token usage.
- Prefer the smallest possible change that solves the task.
- Avoid refactoring unrelated code.
- If solving the task requires widespread changes, explain why before proceeding.
- Reuse existing project patterns whenever possible.
- When Graphify identifies the relevant files, read only those files unless additional context is required.
- Never commit code since I want to review it first.

## Investigation

Before editing:

- Search for existing implementations of the same pattern.
- Prefer modifying existing code over introducing new abstractions.
- Preserve naming conventions and project architecture.
- If there many items to be done, split them into phases and save it to a file so work can be continued across sessions
- If there are out of scope items/ deferred for later items when doing a particular task add thme to a separate file so they can be addressed later.

## Validation

After making changes:

- Build or run the smallest relevant test.
- Fix compilation or lint errors introduced by your changes.
- Do not modify unrelated files.
