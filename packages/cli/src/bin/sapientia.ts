import { ExitCode, GLOBAL_FLAGS, type ArgDef, type CommandDef, type FlagDef } from "@sapientia/core";
import { Command, Option } from "commander";
import { buildRegistry } from "../commands/index.js";
import { runCommand } from "../execute.js";
import { emitError, emitSuccess, wantsJson } from "../render/output.js";
import { renderHuman } from "../render/human.js";
import { VERSION } from "../version.js";

function argSignature(a: ArgDef): string {
  const inner = a.variadic ? `${a.name}...` : a.name;
  return a.required ? `<${inner}>` : `[${inner}]`;
}

function addFlag(cmd: Command, f: FlagDef): void {
  const long = `--${f.name}`;
  const flags =
    f.type === "boolean"
      ? f.short
        ? `-${f.short}, ${long}`
        : long
      : f.short
        ? `-${f.short}, ${long} <value>`
        : `${long} <value>`;
  const opt = new Option(flags, f.description);
  if (f.choices) opt.choices(f.choices);
  if (f.type === "number") opt.argParser((v) => Number(v));
  if (f.type === "string[]") opt.argParser((v: string, prev: string[] = []) => [...prev, v]);
  if (f.default !== undefined) opt.default(f.default);
  cmd.addOption(opt);
}

function main(): void {
  const registry = buildRegistry();
  const program = new Command("sapientia")
    .version(VERSION)
    .description("Multi-source ebook search/download/library manager (agent-native).");

  for (const g of GLOBAL_FLAGS) addFlag(program, g);

  for (const def of registry.list()) {
    const cmd = new Command(def.name).description(def.description);
    for (const a of def.args) cmd.addArgument(cmd.createArgument(argSignature(a), a.description));
    for (const f of def.flags) addFlag(cmd, f);

    cmd.action(async (...callArgs: unknown[]) => {
      const command = callArgs[callArgs.length - 1] as Command;
      const positionals = callArgs.slice(0, def.args.length);
      const flags = command.optsWithGlobals();

      const args: Record<string, string | string[] | undefined> = {};
      def.args.forEach((a, i) => {
        args[a.name] = positionals[i] as string | string[] | undefined;
      });

      await dispatch(def, args, flags);
    });

    program.addCommand(cmd);
  }

  program.parseAsync(process.argv).catch((err) => {
    process.stderr.write(`error: ${String(err)}\n`);
    process.exit(ExitCode.GENERIC);
  });
}

async function dispatch(
  def: CommandDef,
  args: Record<string, string | string[] | undefined>,
  flags: Record<string, unknown>,
): Promise<void> {
  const json = wantsJson(flags, process.env);
  const result = await runCommand(def, { args, flags, env: process.env });

  if (result.ok) {
    emitSuccess(def.name, result.data, result.warnings, json, (data) =>
      renderHuman(def.name, data),
    );
  } else {
    emitError(def.name, result.error!, json);
  }
  process.exit(result.exitCode);
}

main();
