import { action, app } from "photoshop";

export async function multiGet(props: string[] = ["name", "layerID"]) {
  return await action.batchPlay(
    [
      {
        _obj: "multiGet",
        _target: {
          _ref: "document",
          _id: app.activeDocument.id,
        },
        extendedReference: [
          ["name", "layerID"],
          {
            _obj: "layer",
            index: 1,
            count: -1,
          },
        ],
      },
    ],
    {}
  );
}
