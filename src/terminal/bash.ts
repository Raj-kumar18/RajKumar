import FileSystemBash, { FileBash } from "./fileSystemBash";
import Applications from "./applications";

type Cmd = {
  docs: {
    name: string;
    short: string;
    long: string;
  };
  cmd: (self: Cmd, args: string[], options: string[]) => void;
};

export default function Bash(print: (s: string, md?: boolean) => void) {
  const fileSystem = FileSystemBash();
  let path = { p: fileSystem.goHome() };

  const getApp = Applications(print, path);

  function splitArgs(a: string[]) {
    const args: string[] = [];
    const options: string[] = [];

    a.forEach((v) => {
      if (v === "") return;

      if (v.charAt(0) === "-") {
        options.push(v);
        return;
      }

      args.push(v);
    });

    return [args, options];
  }

  function cmdNotFound(cmdName: string) {
    print(`\n${cmdName}:command not found`);
  }

  function prompt() {
    let out = "";
    for (let i = 0; i < path.p.length; i++) {
      out += path.p[i].name;
      if (i !== 0 && i < path.p.length - 1) out += "/";
    }
    out = out.replace(/^\/home\/user/, "~");
    if (out !== "~") out += " ";
    print(`\nuser:${out}$`);
  }

  function input(cmd: string) {
    cmd = cmd.replaceAll(/\s+/g, " ");
    const cmdSplit = cmd.split(" ");
    const cmdName = cmdSplit[0];
    const cmdArgs: string[] = cmdSplit.slice(1);
    console.log("cmd", cmdName, cmdArgs);

    if (cmd) {
      const app = getApp(cmdName);
      if (app) {
        const [args, options] = splitArgs(cmdArgs);
        app(args, options);
      } else {
        const targetPath = fileSystem.goto(path.p, cmdName);
        const target = targetPath?.at(-1);
        if (target) {
          if ("data" in target) {
            print((target as FileBash).data, true);
          } else if ("children" in target) {
            const exactFile = target.children.find(
              (f) =>
                f.name.toLowerCase() === `${target.name.toLowerCase()}.md` &&
                "data" in f
            );
            if (exactFile) {
              print((exactFile as FileBash).data, true);
            } else {
              const mdFiles = target.children.filter(
                (f) => f.name.endsWith(".md") && "data" in f
              ) as FileBash[];
              if (mdFiles.length > 0) {
                mdFiles.sort((a, b) => a.name.localeCompare(b.name));
                const combinedData = mdFiles.map((f) => f.data).join("\n\n");
                print(combinedData, true);
              } else {
                const cdApp = getApp("cd");
                if (cdApp) {
                  cdApp([cmdName], []);
                }
              }
            }
          }
        } else {
          cmdNotFound(cmdName);
        }
      }
    }

    prompt();
  }

  return { input };
}

