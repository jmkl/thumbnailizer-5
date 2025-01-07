import { app, core } from "photoshop";
export async function performAdjustmentLayer<T>(whichlayer: T) {
  await core
    .executeAsModal(
      async () => {
        await app
          .batchPlay(
            [
              {
                _obj: "make",
                _target: [
                  {
                    _ref: "adjustmentLayer",
                  },
                ],
                using: {
                  _obj: "adjustmentLayer",
                  type: whichlayer,
                },
              },
              {
                _obj: "groupEvent",
                _target: [
                  {
                    _ref: "layer",
                    _enum: "ordinal",
                    _value: "targetEnum",
                  },
                ],
              },
            ],
            {}
          )
          .catch((e) => console.log("applyAdjustmentLayer", e));
      },
      { commandName: "adjustment layer" }
    )
    .catch((e) => console.log("applyAdjustmentLayer", e));
}
