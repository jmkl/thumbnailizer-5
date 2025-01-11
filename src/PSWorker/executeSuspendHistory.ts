import { app, core } from "photoshop";

export async function executeSuspendHistory(
  name: string,
  executeSomeStuff: () => Promise<void>
) {
  await core.executeAsModal(
    async (ctx, desc) => {
      let hc = ctx.hostControl;
      let id = app.activeDocument.id;
      let sId = await hc.suspendHistory({
        documentID: id,
        name: name,
      });
      await executeSomeStuff();
      await hc.resumeHistory(sId, true);
    },
    { commandName: name }
  );
}
