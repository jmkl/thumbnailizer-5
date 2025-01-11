import { action } from "photoshop";

export async function undo() {
  return new Promise(async (resolve, reject) => {
    await action
      .batchPlay(
        [
          {
            _obj: "select",
            _target: [
              {
                _ref: "historyState",
                _enum: "ordinal",
                _value: "previous",
              },
            ],
          },
        ],
        {}
      )
      .catch((e) => console.log(e));
    resolve(true);
  });
}
