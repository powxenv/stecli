<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script that shares a name with a built-in command, use `vp run <script>`. For example, if you have a custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not `vp dev` (which always starts Vite's dev server).
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## CI Integration

For GitHub Actions, consider using [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp) to replace separate `actions/setup-node`, package-manager setup, cache, and install steps with a single action.

```yaml
- uses: voidzero-dev/setup-vp@v1
  with:
    cache: true
- run: vp check
- run: vp test
```

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->

## Critical Rules

**Every time a user asks a question or requests code changes, you MUST use the following tools:**

- Web search (via exa mcp tools).
- Latest documentation (via context7 mcp tools).
- Code search (via grep mcp tools).

**Never assume or hallucinate.** Only use external tools when necessary.

When encountering errors or unfamiliar APIs:

1. **For installed libraries in node_modules:**
   - Check the library source code directly in `node_modules/<package-name>`
   - Read the README, types, or source files to understand usage
   - Do NOT use MCP servers for libraries that are already installed

2. **For external libraries or new dependencies:**
   - Only search the internet when you genuinely need external information
   - Use MCP tools for official documentation when unavailable locally
   - Never guess syntax, parameters, or behavior

**Do NOT search the internet for:**

- Basic programming concepts
- Common language features
- Information available in the codebase
- Things you can determine by reading the code or types

## Tool Requirements

For **internal development only**, use **bun** and **bunx** exclusively.
Do **NOT** use npm, npx, pnpm, or yarn for internal development.

## Plan Mode

When operating in Plan Mode:

- Produce concise, execution-focused plans.
- Clarity is required; verbosity is not.
- Do not include explanations, prose, or filler.
- Output only concrete steps.
- Every plan **MUST** end with a section titled **"Unresolved Questions"**.
- Include only questions that materially block execution.
- If there are no blockers, explicitly write:

  **Unresolved Questions: None.**

Failure to follow this structure is not allowed.

## Repository Analysis

When analyzing an external repository:

- Clone the target repository into a **temporary directory** (e.g., `/tmp/repo-analysis-<name>`).
- Perform all analysis, searches, and reads from the cloned copy.
- Once analysis is complete, **delete the cloned directory** to free up disk space.
- Never clone repositories into the project working directory.

## Code Style & Generation Rules

All generated code must follow these rules:

- Code must be self-explanatory.
- Do not use comments.
- Intent must be expressed through naming, structure, and composition only.

Strict consistency is required across:

- File structure
- Module boundaries
- Naming conventions
- Architectural patterns

Before writing any code:

- Explore the existing project.
- Understand the directory layout, conventions, abstractions, and dependency patterns.

## Type Safety Requirements

All code must be **100% type safe** without exceptions:

- **NEVER use `any`** - Use `unknown` with proper type guards instead
- **NEVER use unsafe type casting** - Use type guards, discriminated unions, or generics
- **NEVER use `@ts-ignore` or `@ts-expect-error`** unless absolutely necessary and documented
- **ALWAYS use explicit types** for function parameters and return types
- **ALWAYS prefer strict null checks**
- **ALWAYS use discriminated unions** for union types with different shapes
- **ALWAYS validate external data** (API responses, user input) with runtime type checking (zod, valibot, etc.)
- **ALWAYS ensure end-to-end type safety** from API to UI components

## Software Engineering Principles

Apply these principles in all code:

### SOLID

- **S**ingle Responsibility: Each module/class/function does one thing well
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes must be substitutable for their base types
- **I**nterface Segregation: Prefer small, focused interfaces
- **D**ependency Inversion: Depend on abstractions, not concrete implementations

### KISS (Keep It Simple, Stupid)

- Write simple, readable code
- Avoid unnecessary complexity
- Solve the problem directly, not abstractly

### YAGNI (You Aren't Gonna Need It)

- Don't add functionality until it's actually needed
- Avoid premature abstraction
- Refactor when necessity arises

### DRY (Don't Repeat Yourself)

- Extract duplicated logic into reusable functions/modules
- Use shared utilities for common operations
- Avoid code duplication across packages
