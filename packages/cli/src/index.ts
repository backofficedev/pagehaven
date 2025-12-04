#!/usr/bin/env node
import { program } from "commander";
import { deployCommand } from "./commands/deploy";
import { loginCommand } from "./commands/login";
import { sitesCommand } from "./commands/sites";

program
  .name("pagehaven")
  .description("CLI for deploying static sites to Pagehaven")
  .version("0.0.0");

program.addCommand(loginCommand);
program.addCommand(sitesCommand);
program.addCommand(deployCommand);

program.parse();
