import { Glob } from "bun";

const sourceDirectory = "./src/";
const glob = new Glob("*.ts");
var entrypoints = [...glob.scanSync(sourceDirectory)];
entrypoints = entrypoints.map((x) => sourceDirectory + x);
console.log("Compiling " + entrypoints.length + " typescript files...");
const results = await Bun.build({
  entrypoints: entrypoints,
  publicPath: "./plugin",
  external: ["photoshop", "uxp", "os", "path", "fs"],
  sourcemap: "inline",
  outdir: "./dist",
});

if (results.success == false) {
  console.error("Build failed");
  for (const message of results.logs) {
    console.error(message);
  }
} else {
  console.log("Compiled " + results.outputs.length + " javascript files...");
}
