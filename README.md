# 🐟 Pexe Bot

Bot do servidor **Pexe** — construído com **discord.js v14** e **Node.js 18+**.

Todos são Pexe.

---

## Tech Stack

| Camada          | Tecnologia          |
| --------------- | ------------------- |
| Runtime         | Node.js ≥ 18        |
| Discord library | discord.js ^14.14.1 |
| Environment     | dotenv ^16.4.5      |

---

## Pré-requisitos

- Node.js 18 ou superior
- Uma aplicação Discord com bot token ([Discord Developer Portal](https://discord.com/developers/applications))

---

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
#    Abra o .env e preencha os valores
DISCORD_TOKEN=seu_token_aqui
CLIENT_ID=seu_client_id_aqui
GUILD_ID=id_do_servidor_aqui   # opcional, mas recomendado para dev
```

> **GUILD_ID:** quando definido, os comandos são registrados apenas no servidor especificado (atualização instantânea). Sem ele, os comandos são globais e levam até 1h para propagar no Discord.

> **Nunca commite o `.env`.** Ele já está no `.gitignore`.

```bash
# 3. Iniciar o bot
npm start
```

---

## Funcionalidades

### `/pexe`
Verifica se o bot está online e exibe as latências de conexão.

```
🐟 Pexe tá vivo!
> 💓 Batimento: 42ms
> ⚡ Reflexo: 87ms
```

- **Batimento** — latência do WebSocket (conexão persistente com o Discord)
- **Reflexo** — latência REST (tempo de ida e volta da mensagem)
- Resposta visível apenas para quem usou o comando (ephemeral)

---

### Auto-rename ao entrar
Sempre que um novo membro entra no servidor, o bot define automaticamente o apelido dele como **"Pexe"**. A partir daí, um admin adiciona o restante do nome (`Pexe Abacate`, `Pexemon Go`, etc.).

---

## Habilitar / Desabilitar Funcionalidades

Edite o `config.json` na raiz do projeto e reinicie o bot:

```json
{
    "features": {
        "pexe": true,
        "autorename": true
    }
}
```

Funcionalidades com `false` são removidas da listagem de comandos do Discord — como se não existissem.

---

## Estrutura do Projeto

```
pexe/
├── src/
│   ├── index.js                        # Engine — carrega comandos e eventos, faz login
│   ├── commands/
│   │   └── utility/
│   │       └── pexe.js                 # Comando /pexe
│   └── events/
│       ├── client/
│       │   └── ready.js                # Registra comandos ao iniciar
│       ├── guild/
│       │   └── guildMemberAdd.js       # Auto-rename ao entrar
│       └── interaction/
│           └── interactionCreate.js    # Roteador global de slash commands
├── config.json                         # Feature flags (true/false por funcionalidade)
├── .env                                # Secrets locais (Git-ignored)
├── .gitignore
├── CLAUDE.md                           # Contexto para o agente de IA
├── package.json
└── README.md
```

---

## Criando um Novo Comando

1. Crie um arquivo em `src/commands/<categoria>/<nome>.js`
2. Exporte exatamente duas propriedades:

```js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nome-do-comando')
        .setDescription('Descrição do comando'),

    async execute(interaction) {
        await interaction.reply({ content: 'Resposta', ephemeral: true });
    }
};
```

3. Adicione a chave correspondente no `config.json`:

```json
{
    "features": {
        "nome-do-comando": true
    }
}
```

4. Reinicie o bot. O engine descobre o arquivo automaticamente e registra o comando no Discord.
