import { action, app, core } from "photoshop";
import { currentLayerToSmartObject } from "./currentLayerToSmartObject";

export type RFData = {
  temp: number; // White balance temperature
  tint: number; // White balance tint
  texture: number; // Texture
  clarity: number; // Clarity
  dehaze: number; // Dehaze
  sharpen: number; // Sharpen amount
  sharpen_radius: number; // Sharpen radius
  sharpen_detail: number; // Sharpen detail
  noise_reduction: number; // Noise reduction
  noise_reduction_detail: number; // Noise reduction detail
};

export const RawFilter = (rd: RFData) => {
  return {
    _obj: "Adobe Camera Raw Filter",
    $CrVe: "16.4",
    $PrVN: 6,
    $PrVe: 251920384,
    $WBal: {
      _enum: "$WBal",
      _value: "customEnum",
    },
    $Temp: rd.temp,
    $Tint: rd.tint,
    $CrTx: rd.texture,
    $Cl12: rd.clarity,
    $Dhze: rd.dehaze,
    sharpen: rd.sharpen,
    $ShpR: rd.sharpen_radius,
    $ShpD: rd.sharpen_detail,
    $ShpM: 0,
    $LNR: rd.noise_reduction,
    $LNRD: rd.noise_reduction_detail,
    $LNRC: 0,
    $TMMs: 0,
    $PGTM: 0,
    RGBSetupClass: 0,
    _isCommand: true,
  };
};

async function isApplied() {
  const id = app.activeDocument.activeLayers[0].id;
  const result = await app.batchPlay(
    [
      {
        _obj: "get",
        _target: [
          {
            _ref: "layer",
            _id: id,
          },
          { _ref: "document", _id: app.activeDocument.id },
        ],
      },
    ],
    {}
  );
  const so = result[0].smartObject;
  return so ? [so?.filterFX?.length > 0, so.filterFX] : [false, null];
}

const filter_fx = (idx: number, which_filter: string, is_higpass: boolean) => {
  if (is_higpass)
    return {
      _obj: "set",
      _target: [
        {
          _ref: "filterFX",
          _index: idx + 1,
        },
        {
          _ref: "layer",
          _enum: "ordinal",
          _value: "targetEnum",
        },
      ],
      filterFX: {
        _obj: "filterFX",
        filter: which_filter,
        blendOptions: {
          _obj: "blendOptions",
          opacity: {
            _unit: "percentUnit",
            _value: 100,
          },
          mode: {
            _enum: "blendMode",
            _value: "overlay",
          },
        },
      },
    };
  else
    return {
      _obj: "set",
      _target: [
        {
          _ref: "filterFX",
          _index: idx + 1,
        },
        {
          _ref: "layer",
          _enum: "ordinal",
          _value: "targetEnum",
        },
      ],
      filterFX: {
        _obj: "filterFX",
        filter: which_filter,
      },
    };
};

export async function performRawFilterEffects(
  filter: any,
  filterObject: string
): Promise<string> {
  await core.executeAsModal(
    async (ctx, desc) => {
      const applied = await isApplied();
      let idx_filterobject = applied[1]?.findIndex(
        (e: any) => e.filter._obj === filterObject
      );
      if (applied[0] && idx_filterobject > -1) {
        await currentLayerToSmartObject();
        const result = await action
          .batchPlay(
            [filter_fx(idx_filterobject, filter, filterObject == "highPass")],
            {}
          )
          .catch((e) => {
            console.log(e);
          });
      } else {
        await currentLayerToSmartObject();
        await action.batchPlay([filter], {}).catch((e) => {
          console.log(e);
        });
        if (filterObject == "highPass") {
          const applied = await isApplied();
          let idx_filterobject = applied[1]?.findIndex(
            (e: any) => e.filter._obj === filterObject
          );
          await action
            .batchPlay(
              [filter_fx(idx_filterobject, filter, filterObject == "highPass")],
              {}
            )
            .catch((e) => {
              console.log(e);
            });
        }
      }
    },
    { commandName: "Raw Filter" }
  );

  return "Done";
}

export function isLayerRAWFiltered(rawfilter: boolean) {
  return new Promise((resolve, _) => {
    isApplied().then((result) => {
      let default_raw_filter = {
        temp: 0,
        tint: 0,
        texture: 0,
        clarity: 0,
        dehaze: 0,
        sharpen: 0,
        sharpen_radius: 1.0,
        sharpen_detail: 25,
        noise_reduction: 0,
        noise_reduction_detail: 50,
      };

      if (result[0]) {
        for (const fltrFX of result[1]) {
          const s = fltrFX.filter;

          if (s._obj == "Adobe Camera Raw Filter") {
            default_raw_filter = {
              temp: s["$Temp"],
              tint: s["$Tint"],
              texture: s["$CrTx"], //texture
              clarity: s["$Cl12"], //clarity
              dehaze: s["$Dhze"], //vibrance
              sharpen: s["sharpen"], //sharpen
              sharpen_radius: s["$ShpR"],
              sharpen_detail: s["$ShpD"],
              noise_reduction: s["$LNR"], //noise reduct
              noise_reduction_detail: s["$LNRD"], //color noise reduct
            };
          }
        }
      }

      if (rawfilter) resolve(default_raw_filter);
      else resolve({ ...default_raw_filter });
    });
  });
}
