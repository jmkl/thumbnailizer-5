import { action } from "photoshop";
import { RectSelection } from "./Model";

export async function getSelectionBound(): Promise<RectSelection> {
  const result = await action.batchPlay(
    [
      {
        _obj: "get",

        _target: [
          {
            _property: "selection",
          },

          {
            _ref: "document",

            _enum: "ordinal",

            _value: "targetEnum",
          },
        ],
      },
    ],
    {}
  );

  if (Object.hasOwn(result[0], "selection")) {
    console.log("own selection");
    const s = result[0].selection;
    return {
      mode: s.right._value - s.left._value > 0,
      bound: {
        top: s.top._value,
        bottom: s.bottom._value,
        right: s.right._value,
        left: s.left._value,
      },
    };
  } else {
    return {
      mode: false,
      bound: { top: 0, bottom: 0, left: 0, right: 0 },
    };
  }
}
