
```ts
#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { analyzeCommand } from "./commands/analyze.js";
import { parentsCommand } from "./commands/parents.js";
import { lintCommand } from "./commands/lint.js";

yargs(hideBin(process.argv))
.command(analyzeCommand)
.command(parentsCommand)
.command(lintCommand)
.demandCommand(1)
.help()
.parse();
```

Il commento iniziale è necessario per eseguire lo script direttamente senza usare la terminologia "node" davanti ad ogni comando (per questo tra gli argomenti di yargs uso hideBin)

__proces.argv__: Permette di passsare parametri (in questo momento non vengono passati, ma nel watcher saranno necessari)
__.command:__ Registra i comandi e demandCommand mi obbliga ad averne almeno uno (quindi se l'utente scrive solo il comando senza passare nulla va in errore)
__.parse/help:___ Uno fa il parsing degli argomenti per davvero e l'altro usa l'helper di 