export enum HotkeyToken {
  tl = "arrow-up-left",
  tt = "arrow-up",
  tr = "arrow-up-right",
  ml = "arrow-left",
  mm = "center-center",
  mr = "arrow-right",
  bl = "arrow-down-left",
  bm = "arrow-down",
  br = "arrow-down-right",
  al = "align-left",
  am = "align-center",
  ar = "align-right",
  Scale = "SCALE",
  TagScale = "TAGSCALE",
  ScaleUp = "SCALEUP",
  ScaleDown = "SCALEDOWN",
}
export enum AlignLayer {
  LEFT = "ADSLefts",
  RIGHT = "ADSRights",
  CENTERHORIZONTAL = "ADSCentersH",
  TOP = "ADSTops",
  BOTTOM = "ADSBottoms",
  CENTERVERTICAL = "ADSCentersV",
}

export const AdjustmentLayer = {
  CURVES: {
    _obj: "curves",
    presetKind: {
      _enum: "presetKindType",
      _value: "presetKindDefault",
    },
  },
  EXPOSURE: {
    _obj: "exposure",
    presetKind: {
      _enum: "presetKindType",
      _value: "presetKindDefault",
    },
    exposure: 0,
    offset: 0,
    gammaCorrection: 1,
  },
  HUESATURATION: {
    _obj: "hueSaturation",
    presetKind: {
      _enum: "presetKindType",
      _value: "presetKindDefault",
    },
    colorize: false,
  },
  COLORBALANCE: {
    _obj: "colorBalance",
    shadowLevels: [0, 0, 0],
    midtoneLevels: [0, 0, 0],
    highlightLevels: [0, 0, 0],
    preserveLuminosity: true,
  },
  GRADIENTMAP: {
    _obj: "gradientMapClass",
    gradientsInterpolationMethod: {
      _enum: "gradientInterpolationMethodType",
      _value: "perceptual",
    },
    gradient: {
      _obj: "gradientClassEvent",
      name: "Foreground to Background",
      gradientForm: {
        _enum: "gradientForm",
        _value: "customStops",
      },
      interfaceIconFrameDimmed: 4096,
      colors: [
        {
          _obj: "colorStop",
          color: {
            _obj: "RGBColor",
            red: 0,
            grain: 0,
            blue: 0,
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
            red: 255,
            grain: 255,
            blue: 255,
          },
          type: {
            _enum: "colorStopType",
            _value: "userStop",
          },
          location: 4096,
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
          location: 4096,
          midpoint: 50,
        },
      ],
    },
  },
  LUT: {
    _class: "colorLookup",
  },
};
export type TagVert = {
  tag: boolean;
  vertical_align: boolean;
};

export type Template = {
  template_name: string;
  lines: Line[];
};

export type Line = {
  index: number;
  value: string;
  state: LineState;
};

export enum LineState {
  NORMAL = 0,
  EMBLEM = 1,
  TAG = 2,
  ALT = 3,
}

export type SocketServerData = {
  fromserver: boolean;
  type: string;
  data: string;
  template_index?: number;
  uuid?: string;
  channel?: string;
};

export type SelectionBound = {
  top: number;
  bottom: number;
  right: number;
  left: number;
};

export type RectSelection = {
  mode: boolean;
  bound: SelectionBound;
};

export type LinkedObject = {
  type: string;
  name: string;
  category: string;
};
