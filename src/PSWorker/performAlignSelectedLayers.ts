import { action, core } from "photoshop";

export async function performAlignSelectedLayers<T>(
  alignto: T,
  toCanvas: boolean
) {
  await core
    .executeAsModal(
      async () => {
        await action.batchPlay(
          [
            {
              _obj: "align",
              _target: [
                {
                  _ref: "layer",
                  _enum: "ordinal",
                  _value: "targetEnum",
                },
              ],
              using: {
                _enum: "alignDistributeSelector",
                _value: alignto,
              },
              alignToCanvas: toCanvas,
            },
          ],
          {}
        );
      },
      { commandName: "align layers" }
    )
    .catch((e) => {
      console.log(e);
    });
}
