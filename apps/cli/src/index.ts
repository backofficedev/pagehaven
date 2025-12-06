#!/usr/bin/env node
import { program } from "commander";
import { deployCommand } from "./commands/deploy";
import { initCommand } from "./commands/init";
import { linkCommand } from "./commands/link";
import { loginCommand, logoutCommand, whoamiCommand } from "./commands/login";
import { sitesCommand } from "./commands/sites";
import { statusCommand } from "./commands/status";

program
  .name("pagehaven")
  .description("CLI for deploying static sites to Pagehaven")
  .version("0.0.0");

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(whoamiCommand);
program.addCommand(initCommand);
program.addCommand(linkCommand);
program.addCommand(sitesCommand);
program.addCommand(statusCommand);
program.addCommand(deployCommand);

program.parse();
