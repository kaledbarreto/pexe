# 🐟 Claude Context File: Project Architecture & Rules

This file serves as the single source of truth for the project's technical memory, constraints, architecture, and roadmap. The AI agent must read this file before performing any task and update it immediately after any structural changes, file creations, or feature completions.

---

## 🛡️ 1. Immutables & Architectural Constraints (Do Not Violate)

* **100% Stateless Architecture:** Absolutely NO persistent databases (SQL, NoSQL, MongoDB, Supabase, Redis) or local file writes (JSON, CSV) for state/guild management. All data, validations, and concurrency checks must be resolved at runtime using the in-memory cache populated at startup (`guild.members.cache`).
* **Member Cache Strategy:** `ready.js` calls `guild.members.fetch()` once at startup for every guild, populating the cache. All runtime operations (duplicate checks, role verifications) must use `guild.members.cache` — never call `guild.members.fetch()` inside interaction handlers to avoid Gateway rate limits.
* **Framework & Version:** Node.js (v18+) with `discord.js` version 14 (`^14.14.1`). Strict adherence to v14 syntax (e.g., proper GatewayIntentBits, Partials, and SlashCommandBuilder execution format).
* **Command & Event Handler Pattern:** The project uses a dynamic file-scanning bootstrap.
    * Individual features must be fully encapsulated into isolated files under `src/commands/<category>/`.
    * Global event listeners must live under `src/events/<category>/`, organized by domain: `client/` (bot lifecycle), `guild/` (server events), `interaction/` (slash commands, buttons, modals).
    * Both scanners operate identically: `index.js` iterates subfolders first, then `.js` files within each — making both systems symmetrical and extensible without touching the engine.
    * `src/index.js` acts as the immutable engine orchestrating the dynamic imports.
* **Ephemeral UI Feedback:** All user validation failures, background processes, or error logs must use `flags: MessageFlags.Ephemeral` (imported from `discord.js`). Never use the deprecated `ephemeral: true` option.
* **Security:** Hardcoding tokens (`DISCORD_TOKEN`, `CLIENT_ID`) is strictly prohibited. Use `process.env` backed by a local `.env` file (Git ignored). Role IDs are hardcoded as named constants at the top of the file that uses them.
* **Feature Flags via `config.json`:** Enabling/disabling features is done by editing `config.json` at the project root and restarting the bot. Disabled commands are filtered out of the registration payload in `ready.js` and simply don't appear in Discord.

---

## 💻 2. Coding Standards & Boilerplates

### Command Contract Requirements
Every new command created under `src/commands/<category>/<command>.js` must export an object containing exactly two properties:
1. `data`: An instance of `SlashCommandBuilder` defining the name, description, and arguments.
2. `execute`: An asynchronous function that receives the `interaction` context object and runs the logic.

### Feature Flag Convention
Every new command must have a matching key added to `config.json` under `"features"`. The key must match the command's `data.name` exactly. Commands without a key in `config.json` are treated as enabled by default (`!== false`).

### discord.js v14 Deprecation Rules
To avoid runtime warnings, always follow these patterns (v15 breaking changes already enforced here):
- **Ephemeral replies:** use `flags: MessageFlags.Ephemeral`, never `ephemeral: true`
- **Fetching the reply after sending:** use `withResponse: true` instead of `fetchReply: true`. The return is `{ resource }` — access the message via `resource.message`
- **Client ready event:** use `name: 'clientReady'`, never `name: 'ready'`

### Error Resilience
All runtime interactions must be wrapped in `try/catch` blocks. Separate `try/catch` per independent operation (e.g., nickname change and role assignment in separate blocks) so one failure doesn't mask the other. The global `error` event on the Client is handled by `src/events/client/error.js` to prevent process crashes on unhandled Gateway errors.

---

## 📊 3. Current Project State

### Environment Variables (`.env`)
| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | Yes | Bot token from the Discord Developer Portal |
| `CLIENT_ID` | Yes | Application ID from the Discord Developer Portal |
| `GUILD_ID` | No | If set, commands are registered to this guild only (instant updates). If omitted, commands are registered globally (up to 1h propagation). Recommended for development. |

### Feature Flags (`config.json`)
| Key | Default | Description |
|---|---|---|
| `pexe` | `true` | Enables the `/pexe` command |
| `autorename` | `true` | Enables auto-rename + role assignment on member join |
| `setup-registro` | `true` | Enables the `/setup-registro` admin command |
| `cargos` | `true` | Enables the `/cargos` admin command |

### Server Role Constants
| Constant | ID | Cargo | File |
|---|---|---|---|
| `CARGO_MEMBRO_ID` | `681926568653750342` | 🐟 \| Cardume | `interactionCreate.js` |
| `CARGO_PENDENTE_ID` | `1508865619838107700` | Perdidos | `interactionCreate.js` |
| `CARGO_REGRAS_ID` | `936280227414425711` | Li as Regras e Concordo | `guildMemberAdd.js` |
| `CARGO_PERDIDOS_ID` | `1508865619838107700` | Perdidos | `guildMemberAdd.js` |

### File Mapping
* `CLAUDE.md` *(this file)* — AI context file at project root; auto-loaded by the Claude Code CLI.
* `README.md` — Human-facing project documentation: setup guide, features, and command authoring instructions.
* `.gitignore` — Excludes `node_modules/`, `.env`, logs, and IDE artifacts from version control.
* `package.json` — Project manifest; declares `discord.js ^14.14.1` and `dotenv ^16.4.5` as dependencies, Node ≥ 18 engine requirement.
* `.env` — Environment variables (Git-ignored): `DISCORD_TOKEN`, `CLIENT_ID`, and optional `GUILD_ID`.
* `config.json` — Feature flags. Each entry is `"commandName": true/false`. Filtered at startup in `ready.js`; disabled commands are never registered with Discord. Edit and restart to apply changes.
* `src/index.js` — Core bootstrap engine. Creates the Discord `Client`, dynamically scans `src/commands/<category>/` and `src/events/<category>/` at startup, registers all handlers, and calls `client.login()`. Intents: `Guilds`, `GuildMembers`.
* `src/events/client/ready.js` — Registered under `clientReady`. Fetches all guild members at startup to populate the cache. If `GUILD_ID` is set, clears global commands to avoid duplicates. Clears all guild-specific command overrides. Registers only enabled commands (filtered via `config.json`) to guild or globally.
* `src/events/client/error.js` — Listens to the Client `error` event and logs it to the console. Prevents unhandled Gateway errors (e.g., rate limits) from crashing the process.
* `src/events/interaction/interactionCreate.js` — Central interaction router. Handles: (1) `ChatInputCommand` — routes to command handlers; (2) `Button` `trigger_registro_pexe` — checks if member has `CARGO_PENDENTE_ID` (Perdidos), if not bars them as already registered, otherwise shows the modal; (3) `ModalSubmit` `modal_registro_pexe` — strips leading "Pexe" prefix from input, validates case-insensitive duplicates against `guild.members.cache`, sets nickname to "Pexe {sobrenome}", removes `CARGO_PENDENTE_ID` and adds `CARGO_MEMBRO_ID`. Each operation (nickname, roles) has its own `try/catch`.
* `src/events/guild/guildMemberAdd.js` — Fires on every new member join; checks `config.features.autorename`, sets nickname to "Pexe", and adds `CARGO_REGRAS_ID` + `CARGO_PERDIDOS_ID` in a single `roles.add()` call. Nickname and role operations have separate `try/catch`.
* `src/commands/utility/pexe.js` — `/pexe` command; ephemerally shows WebSocket latency ("Batimento 💓") and REST latency ("Reflexo ⚡") with a themed "Pexe tá vivo!" message.
* `src/commands/admin/setup-registro.js` — `/setup-registro` admin-only command. Sends a themed embed ("Cartório do Cardume") with a "📥 Registrar-se" button to the current channel via `interaction.channel.send()`, confirming to the admin ephemerally.
* `src/commands/admin/cargos.js` — `/cargos` admin-only command with three subcommands: `adicionar`, `remover`, `substituir`. Each takes a `filtro` (free-text exact nickname) and one or two role options. Uses `guild.members.cache` to find targets and `Promise.allSettled` for parallel role updates. Reports successes and failures to the admin ephemerally.

---

## 🗺️ 4. Roadmap & Next Steps

- [x] **Step 1:** Initialize `package.json` with dependencies (`discord.js`, `dotenv`) and configure `.env` structure.
- [x] **Step 2:** Generate the core engine (`src/index.js`) implementing the dynamic command/event handlers and Discord client login.
- [x] **Step 3:** Implement base infrastructure events (`ready.js`, `interactionCreate.js`, `guildMemberAdd.js`). Events organized into category subfolders (`client/`, `guild/`, `interaction/`).
- [x] **Step 4:** Implement `config.json` feature flags. Disabled commands are filtered at registration time and invisible in Discord. `ready.js` clears both global and guild command overrides on startup to prevent stale duplicates.
- [x] **Step 5:** Implement sistema de registro — `/setup-registro` (embed + botão), modal de sobrenome, validação de duplicata, remoção do cargo Perdidos e atribuição do cargo Cardume.
- [x] **Step 6:** Implement `/cargos` (gerenciamento de cargos em massa por filtro de nick), `error.js` (prevenção de crashes), cache de membros populado no startup, e auto-assign de cargos no `guildMemberAdd`.
- [ ] **Step 7:** Implement next features (TBD).

---
[SYSTEM INSTRUCTION FOR CLAUDE: When modifying or creating files, check off the roadmap tasks above and document new files in the "Current Project State" section. Keep this file updated dynamically.]
