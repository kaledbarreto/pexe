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

---

### Auto-assign ao entrar
Quando um novo membro entra no servidor, o bot automaticamente:
- Define o apelido como **"Pexe"**
- Adiciona os cargos **"Li as Regras e Concordo"** e **"Perdidos"**

> Controlado pela flag `autorename` no `config.json`.

---

### `/setup-registro` *(admin)*
Envia a mensagem do **Cartório do Cardume** no canal atual — um embed com o botão de registro.

O fluxo de registro:
1. Membro clica em **📥 Registrar-se**
2. Modal abre pedindo o sobrenome Pexe
3. Bot valida duplicatas (case-insensitive) contra todos os membros do servidor
4. Se aprovado: define o apelido como `Pexe {Sobrenome}`, remove o cargo **Perdidos** e adiciona o cargo **Cardume**

> O bot impede que o membro coloque "Pexe" no início do sobrenome (ex: "Pexe Arroz" vira "Arroz" automaticamente).

---

### `/cargos` *(admin)*
Gerencia cargos em massa filtrando por apelido exato.

| Subcomando | Descrição |
|---|---|
| `adicionar` | Adiciona um cargo a todos com o nick especificado |
| `remover` | Remove um cargo de todos com o nick especificado |
| `substituir` | Troca um cargo por outro em todos com o nick especificado |

```
/cargos substituir filtro:Pexe remover:@Cardume adicionar:@Perdidos
/cargos adicionar  filtro:Pexe Batata cargo:@Cardume
/cargos remover    filtro:Pexe Arroz  cargo:@Perdidos
```

---

## Habilitar / Desabilitar Funcionalidades

Edite o `config.json` na raiz do projeto e reinicie o bot:

```json
{
    "features": {
        "pexe": true,
        "autorename": true,
        "setup-registro": true,
        "cargos": true
    }
}
```

Funcionalidades com `false` são removidas da listagem de comandos do Discord — como se não existissem.

---

## Estrutura do Projeto

```
pexe/
├── src/
│   ├── index.js                          # Engine — carrega comandos e eventos, faz login
│   ├── commands/
│   │   ├── admin/
│   │   │   ├── setup-registro.js         # Comando /setup-registro
│   │   │   └── cargos.js                 # Comando /cargos
│   │   └── utility/
│   │       └── pexe.js                   # Comando /pexe
│   └── events/
│       ├── client/
│       │   ├── ready.js                  # Registra comandos e popula cache ao iniciar
│       │   └── error.js                  # Previne crashes em erros do Gateway
│       ├── guild/
│       │   └── guildMemberAdd.js         # Auto-rename e cargos ao entrar
│       └── interaction/
│           └── interactionCreate.js      # Roteador: slash commands, botões e modais
├── config.json                           # Feature flags (true/false por funcionalidade)
├── .env                                  # Secrets locais (Git-ignored)
├── .gitignore
├── CLAUDE.md                             # Contexto para o agente de IA
├── package.json
└── README.md
```

---

## Criando um Novo Comando

1. Crie um arquivo em `src/commands/<categoria>/<nome>.js`
2. Exporte exatamente duas propriedades:

```js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nome-do-comando')
        .setDescription('Descrição do comando'),

    async execute(interaction) {
        await interaction.reply({ content: 'Resposta', flags: MessageFlags.Ephemeral });
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
