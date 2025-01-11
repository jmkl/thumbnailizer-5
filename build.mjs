import * as esbuild from "esbuild";
import esbuildPluginTsc from "esbuild-plugin-tsc";
import path from "path";
import fs from "fs";

const mode = process.argv.slice(2);
const prod = mode.length > 0 && mode[0] == "production" ? true : false;

let cleaningUp = {
  name: "cleanUp",
  setup(build) {
    build.onStart(async (args) => {
      console.log("build start");
      console.time("cleaning up...");
      fs.readdirSync(path.resolve("dist")).forEach((file) => {
        fs.unlinkSync("dist/" + file);
      });
      console.timeEnd("cleaning up...");

      console.time("copying shit...");
      fs.readdirSync(path.resolve("plugin")).forEach((file) => {
        fs.copyFile("plugin/" + file, "dist/" + file, (err) => {
          if (err) throw err;
        });
      });
      console.timeEnd("copying shit...");
    });
    build.onEnd((result) => {
      console.log(`build ends with ${JSON.stringify(result)}`);
    });
  },
};
const config = {
  entryPoints: ["src/main.ts"],
  outfile: "dist/index.js",
  bundle: true,
  minify: prod ? true : false,
  sourcemap: prod ? false : true,
  platform: "node",
  treeShaking: true,
  target: "esnext",
  external: ["photoshop", "uxp", "os", "path", "fs"],
  loader: {
    ".ts": "ts",
    ".tsx": "tsx",
  },

  plugins: [
    esbuildPluginTsc({
      force: true,
    }),
    cleaningUp,
  ],
};

if (prod) {
  await esbuild.build(config);
} else {
  let ctx = await esbuild.context(config);
  await ctx.watch();
  console.warn("Watching...");
}
