import { action, core } from "photoshop";

export async function soloLayer(id: number) {
  await core.executeAsModal(
    async (ctx, desc) => {
      await action.batchPlay(
        [
          {
            _obj: "show",
            null: [
              {
                _ref: "layer",
                _id: id,
              },
            ],
            toggleOptionsPalette: true,
          },
        ],
        {}
      );
    },
    { commandName: "solo layer" }
  );
}
