# 🐟 Claude Context File: Project Architecture & Rules

This file serves as the single source of truth for the project's technical memory, constraints, architecture, and roadmap. The AI agent must read this file before performing any task and update it immediately after any structural changes, file creations, or feature completions.

---

## 🛡️ 1. Immutables & Architectural Constraints (Do Not Violate)

* **100% Stateless Architecture:** Absolutely NO persistent databases (SQL, NoSQL, MongoDB, Supabase, Redis) or local file writes (JSON, CSV) for state/guild management. All data, validations, and concurrency checks must be resolved at runtime using asynchronous Discord Gateway API calls (e.g., `guild.members.fetch()`).
* **Framework & Version:** Node.js (v18+) with `discord.js` version 14 (`^14.14.1`). Strict adherence to v14 syntax (e.g., proper GatewayIntentBits, Partials, and SlashCommandBuilder execution format).
* **Command & Event Handler Pattern:** The project uses a dynamic file-scanning bootstrap.
    * Individual features must be fully encapsulated into isolated files under `src/commands/<category>/`.
    * Global event listeners must live under `src/events/<category>/`, organized by domain: `client/` (bot lifecycle), `guild/` (server events), `interaction/` (slash commands, buttons, modals).
    * Both scanners operate identically: `index.js` iterates subfolders first, then `.js` files within each — making both systems symmetrical and extensible without touching the engine.
    * `src/index.js` acts as the immutable engine orchestrating the dynamic imports.
* **Ephemeral UI Feedback:** All user validation failures, background processes, or error logs must use `flags: MessageFlags.Ephemeral` (imported from `discord.js`). Never use the deprecated `ephemeral: true` option.
* **Security:** Hardcoding tokens (`DISCORD_TOKEN`, `CLIENT_ID`) is strictly prohibited. Use `process.env` backed by a local `.env` file (Git ignored).
* **Feature Flags via `config.json`:** Enabling/disabling features is done by editing `config.json` at the project root and restarting the bot. Disabled commands are filtered out of the registration payload in `ready.js` and simply don't appear in Discord. No slash command overrides, no Discord roles as flags.

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
All runtime interactions must be wrapped in `try/catch` blocks. If an execution fails, it must be caught by the global router in `interactionCreate.js` to ensure the bot process stays online continuously.

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
| `autorename` | `true` | Enables auto-rename on member join |

### File Mapping
* `CLAUDE.md` *(this file)* — AI context file at project root; auto-loaded by the Claude Code CLI.
* `README.md` — Human-facing project documentation: setup guide, features, and command authoring instructions.
* `.gitignore` — Excludes `node_modules/`, `.env`, logs, and IDE artifacts from version control.
* `package.json` — Project manifest; declares `discord.js ^14.14.1` and `dotenv ^16.4.5` as dependencies, Node ≥ 18 engine requirement.
* `.env` — Environment variables (Git-ignored): `DISCORD_TOKEN`, `CLIENT_ID`, and optional `GUILD_ID`.
* `config.json` — Feature flags. Each entry is `"commandName": true/false`. Filtered at startup in `ready.js`; disabled commands are never registered with Discord. Edit and restart to apply changes.
* `src/index.js` — Core bootstrap engine. Creates the Discord `Client`, dynamically scans `src/commands/<category>/` and `src/events/<category>/` at startup, registers all handlers, and calls `client.login()`. Intents: `Guilds`, `GuildMembers`.
* `src/events/client/ready.js` — Registered under `clientReady` (not `ready`). If `GUILD_ID` is set, clears global commands first to avoid duplicates from previous deployments. Then clears all guild-specific command overrides for all guilds. Finally registers only the enabled commands (filtered via `config.json`) either to the specific guild or globally. Logs: `🐟 Pexe online — <tag>` and `✅ N comando(s) registrado(s) [servidor/global]`.
* `src/events/interaction/interactionCreate.js` — Global command router; resolves the incoming `ChatInputCommand` interaction to the correct handler and wraps execution in a `try/catch`, replying with `MessageFlags.Ephemeral` on error.
* `src/events/guild/guildMemberAdd.js` — Fires on every new member join; checks `config.features.autorename` before setting the member's nickname to "Pexe".
* `src/commands/utility/pexe.js` — `/pexe` command; ephemerally shows WebSocket latency (labeled "Batimento 💓") and REST latency (labeled "Reflexo ⚡") with a themed "Pexe tá vivo!" message.

---

## 🗺️ 4. Roadmap & Next Steps

- [x] **Step 1:** Initialize `package.json` with dependencies (`discord.js`, `dotenv`) and configure `.env` structure.
- [x] **Step 2:** Generate the core engine (`src/index.js`) implementing the dynamic command/event handlers and Discord client login.
- [x] **Step 3:** Implement base infrastructure events (`ready.js`, `interactionCreate.js`, `guildMemberAdd.js`). Events organized into category subfolders (`client/`, `guild/`, `interaction/`).
- [x] **Step 4:** Implement `config.json` feature flags. Disabled commands are filtered at registration time and invisible in Discord. `ready.js` clears both global and guild command overrides on startup to prevent stale duplicates.
- [ ] **Step 5:** Implement next features (TBD).

---
[SYSTEM INSTRUCTION FOR CLAUDE: When modifying or creating files, check off the roadmap tasks above and document new files in the "Current Project State" section. Keep this file updated dynamically.]
