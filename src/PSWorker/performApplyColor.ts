import { action, app, constants, core } from "photoshop";
import { findLayer } from "./findLayer";

export type ColorAttr = {
  tri_color: [string, string, string];
  top: number;
  bottom: number;
};

async function addGuide(t: number, b: number) {
  await core.executeAsModal(
    async (context, descriptor) => {
      const top = Math.floor((t / 4096) * 720);
      const bot = Math.floor((b / 4096) * 720);
      app.activeDocument.guides.removeAll();
      app.activeDocument.guides.add(constants.Direction.HORIZONTAL, top);
      app.activeDocument.guides.add(constants.Direction.HORIZONTAL, bot);
    },
    { commandName: "add guide" }
  );
}
export async function performApplyColor(color: ColorAttr) {
  await addGuide(color.top, color.bottom);
  const _id = await findLayer(app.activeDocument.layers, "colorfill").id;
  const top = hex2rgb(color.tri_color[0]);
  const mid = hex2rgb(color.tri_color[1]);
  const bottom = hex2rgb(color.tri_color[2]);
  await core.executeAsModal(
    async (c, d) => {
      await action.batchPlay(
        [
          {
            _obj: "select",
            _target: { _ref: "layer", _id: _id },
          },
          {
            _obj: "applyLocking",
            _target: [
              {
                _ref: "layer",
                _enum: "ordinal",
                _value: "targetEnum",
              },
            ],
            layerLocking: {
              _obj: "layerLocking",
              protectAll: false,
            },
          },
        ],
        {}
      );

      const cmd_triple = TriColor(top, mid, bottom, color.top, color.bottom);
      await action.batchPlay([cmd_triple], {});
      await action.batchPlay(
        [
          {
            _obj: "applyLocking",
            _target: [
              {
                _ref: "layer",
                _enum: "ordinal",
                _value: "targetEnum",
              },
            ],
            layerLocking: {
              _obj: "layerLocking",
              protectAll: true,
            },
          },
        ],
        {}
      );
    },
    { commandName: "apply color" }
  );
}

export async function removeGuides() {
  await core.executeAsModal(
    async (context, descriptor) => {
      app.activeDocument.guides.removeAll();
    },
    { commandName: "removing Guides" }
  );
}

function hex2rgb(hex: string) {
  hex = hex.replace(/^#/, "");

  // Check if it's a 3-digit or 6-digit hex code
  if (hex.length === 3) {
    // Expand 3-digit hex to 6-digit hex
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  var r = parseInt(hex.slice(0, 2), 16),
    g = parseInt(hex.slice(2, 4), 16),
    b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

function TriColor(
  top: number[],
  mid: number[],
  bot: number[],
  pos_a: number,
  pos_b: number
) {
  return {
    _obj: "set",
    _target: [
      {
        _ref: "contentLayer",
        _enum: "ordinal",
        _value: "targetEnum",
      },
    ],
    to: {
      _obj: "gradientLayer",
      gradientsInterpolationMethod: {
        _enum: "gradientInterpolationMethodType",
        _value: "perceptual",
      },
      angle: {
        _unit: "angleUnit",
        _value: -90,
      },
      type: {
        _enum: "gradientType",
        _value: "linear",
      },
      scale: {
        _unit: "percentUnit",
        _value: 100,
      },
      gradient: {
        _obj: "gradientClassEvent",
        name: "Custom",
        gradientForm: {
          _enum: "gradientForm",
          _value: "customStops",
        },
        interfaceIconFrameDimmed: 0,
        colors: [
          {
            _obj: "colorStop",
            color: {
              _obj: "RGBColor",
              red: top[0], // 1
              grain: top[1],
              blue: top[2],
            },
            type: {
              _enum: "colorStopType",
              _value: "userStop",
            },
            location: 0,
            midpoint: 50,
          },
          {
            _obj: "colorStop",
            color: {
              _obj: "RGBColor",
              red: top[0], // 1
              grain: top[1],
              blue: top[2],
            },
            type: {
              _enum: "colorStopType",
              _value: "userStop",
            },
            location: pos_a - 1,
            midpoint: 50,
          },
          {
            _obj: "colorStop",
            color: {
              _obj: "RGBColor",
              red: mid[0], // 1
              grain: mid[1],
              blue: mid[2],
            },
            type: {
              _enum: "colorStopType",
              _value: "userStop",
            },
            location: pos_a,
            midpoint: 50,
          },
          {
            _obj: "colorStop",
            color: {
              _obj: "RGBColor",
              red: mid[0], // 1
              grain: mid[1],
              blue: mid[2],
            },
            type: {
              _enum: "colorStopType",
              _value: "userStop",
            },
            location: pos_b,
            midpoint: 50,
          },
          {
            _obj: "colorStop",
            color: {
              _obj: "RGBColor",
              red: bot[0], // 1
              grain: bot[1],
              blue: bot[2],
            },
            type: {
              _enum: "colorStopType",
              _value: "userStop",
            },
            location: pos_b + 1,
            midpoint: 50,
          },
        ],
        transparency: [
          {
            _obj: "transferSpec",
            opacity: {
              _unit: "percentUnit",
              _value: 100,
            },
            location: 0,
            midpoint: 50,
          },
          {
            _obj: "transferSpec",
            opacity: {
              _unit: "percentUnit",
              _value: 100,
            },
            location: 0,
            midpoint: 50,
          },
          {
            _obj: "transferSpec",
            opacity: {
              _unit: "percentUnit",
              _value: 100,
            },
            location: 4096,
            midpoint: 50,
          },
        ],
      },
    },
  };
}
