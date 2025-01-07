import { action, app, core } from "photoshop";
import { HotkeyToken, TagVert } from "./Model";

async function geser(x: number, y: number) {
  await core.executeAsModal(
    async () => {
      await action.batchPlay(
        [
          {
            _obj: "move",
            _target: [
              {
                _ref: "layer",
                _enum: "ordinal",
                _value: "targetEnum",
              },
            ],
            to: {
              _obj: "offset",
              horizontal: {
                _unit: "pixelsUnit",
                _value: x,
              },
              vertical: {
                _unit: "pixelsUnit",
                _value: y,
              },
            },
          },
        ],
        {}
      );
    },
    { commandName: "geser dong" }
  );
}

export async function performAlignLayer(
  tagvertalign: TagVert,
  val: HotkeyToken
) {
  const docWidth = 1280;
  const docHeight = 720;
  const _all = app.activeDocument.activeLayers;
  const ver = _all.sort(function (a, b) {
    return a.boundsNoEffects.top - b.boundsNoEffects.top;
  });
  const verbot = _all.sort(function (a, b) {
    return b.boundsNoEffects.bottom - a.boundsNoEffects.bottom;
  });
  const _left = _all.sort(function (a, b) {
    return a.boundsNoEffects.left - b.boundsNoEffects.left;
  });
  const _right = _all.sort(function (a, b) {
    return b.boundsNoEffects.right - a.boundsNoEffects.right;
  });

  const top = ver[0].boundsNoEffects.top;
  const bottom = verbot[0].boundsNoEffects.bottom;
  const left = _left[0].boundsNoEffects.left;
  const right = _right[0].boundsNoEffects.right;

  const width = right - left;
  const height = bottom - top;

  const margin = 30; //!GAP
  const leftGut = tagvertalign.tag ? 104 : 0;
  const isMid = tagvertalign.vertical_align;

  const x = docWidth / 2 - (width / 2 + left);
  let y = 0;
  if (isMid) {
    y = docHeight / 2 - (height / 2 + top);
  }

  switch (val) {
    case HotkeyToken.tl:
      await geser(-left + (leftGut + margin), margin + -top);
      break;
    case HotkeyToken.tr:
      await geser(docWidth - right - margin, margin + -top);
      break;
    case HotkeyToken.bl:
      await geser(-left + (leftGut + margin), docHeight - bottom - margin);
      break;
    case HotkeyToken.br:
      await geser(docWidth - right - margin, docHeight - bottom - margin);

      break;
    case HotkeyToken.ml:
      await geser(-left + (leftGut + margin), 0);

      break;
    case HotkeyToken.mr:
      await geser(docWidth - right - margin, 0);

      break;
    case HotkeyToken.tt:
      await geser(x + leftGut / 2, -top + margin);
      break;

    case HotkeyToken.bm:
      await geser(x + leftGut / 2, docHeight - bottom - margin);

      break;
    case HotkeyToken.mm:
      await geser(x + leftGut / 2, y);

      break;

    case HotkeyToken.Scale:
      await core.executeAsModal(
        async () => {
          const scale = ((docWidth - leftGut - margin * 2) / width) * 100;
          await app.activeDocument.activeLayers[0].scale(scale, scale);
        },
        { commandName: "some tag" }
      );
      break;
    case HotkeyToken.TagScale:
      await core.executeAsModal(
        async () => {
          const curlayer = app.activeDocument.activeLayers[0];
          const scale = 95;
          await curlayer.scale(scale, scale);
        },
        { commandName: "some tag" }
      );
      break;
    case HotkeyToken.ScaleUp:
      await core.executeAsModal(
        async () => {
          const curlayer = app.activeDocument.activeLayers[0];
          const scale = 105;
          await curlayer.scale(scale, scale);
        },
        { commandName: "some tag" }
      );
      break;
    case HotkeyToken.ScaleDown:
      await core.executeAsModal(
        async () => {
          const curlayer = app.activeDocument.activeLayers[0];
          const scale = 95;
          await curlayer.scale(scale, scale);
        },
        { commandName: "some tag" }
      );
      break;
  }
}
