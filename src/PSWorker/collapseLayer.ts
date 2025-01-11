import { action, app, core } from "photoshop";
import { findGroup } from "./findGroup";

export async function collapseLayer(
  layerName: string,
  expand: boolean = false,
  recursive: boolean = true
) {
  const id = findGroup(app.activeDocument.layers, layerName).id;
  await core.executeAsModal(
    async (ctx, desc) => {
      await action.batchPlay(
        [
          {
            _obj: "select",
            _target: { _ref: "layer", _id: id },
            makeVisible: true,
          },
          {
            _obj: "set",
            _target: {
              _ref: [
                { _property: "layerSectionExpanded" },
                {
                  _ref: "layer",
                  _enum: "ordinal",
                  _value: "targetEnum",
                },
              ],
            },
            to: expand,
            recursive,
            _options: { dialogOptions: "dontDisplay" },
          },
        ],
        { synchronousExecution: true }
      );
    },
    {
      commandName: "collapse layer",
    }
  );
}
