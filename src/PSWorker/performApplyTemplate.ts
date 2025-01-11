import { storage } from "uxp";
import { appendLinkedObject } from "./appendLinkedObject";
import { app, core } from "photoshop";
import { multiGet } from "./multiGet";
import { Layers } from "photoshop/dom/collections/Layers";
import { Layer } from "photoshop/dom/Layer";
import { Line, LineState, Template } from "./Model";
import { findLayer } from "./findLayer";

export async function performApplyTemplate(
  templateFolder: storage.Folder,
  tmplt: Template
) {
  const entries = await templateFolder.getEntries();
  const all_templates = entries
    .filter((e) => e.isFile)
    .map((e) => {
      return { name: e.name, object: e as storage.File };
    });
  const current = all_templates.filter((at) => at.name == tmplt.template_name);
  if (current.length > 0) {
    await appendTemplate(current[0].object, tmplt.lines, false);
  }
}

async function changeTexts(
  layer: Layer,
  texts: Line[],
  gap: number,
  margin_top: number,
  margin_left: number
) {
  if (layer)
    await core.executeAsModal(
      async (ctx, desc) => {
        if (layer.name === "dcsmstext_alt") {
          layer.visible = true;
        }

        let top = margin_top;
        for await (const [index, t] of texts.entries()) {
          const lyr = await layer.duplicate();
          lyr.name = "dcsmstext_tamper";
          const textItem = lyr.textItem;
          textItem.contents = t.value;
          let h = lyr.boundsNoEffects.bottom - lyr.boundsNoEffects.top + gap;
          const hindex = h * index;
          const bmargin = lyr.boundsNoEffects.top - margin_top;
          top =
            index == 0
              ? -(lyr.boundsNoEffects.top - margin_top)
              : -(bmargin - hindex);
          await lyr.translate(-(lyr.boundsNoEffects.left - margin_left), top);
        }
        await layer.delete();
      },
      { commandName: "changing text" }
    );
}

async function appendTemplate(
  template: storage.File,
  texts: Line[],
  with_tag: boolean
) {
  const gap = 10;
  const margin_top = 30;
  const margin_left = with_tag ? 104 : margin_top;
  await appendLinkedObject(template, template.name, true).then(async () => {
    const layers = app.activeDocument.layers;
    const mainText = findLayer(layers, "dcsmstext");
    const altText = findLayer(layers, "dcsmstext_alt");
    await changeTexts(
      mainText,
      texts.filter((e) => e.state === LineState.NORMAL),
      gap,
      margin_top,
      margin_left
    );
    await changeTexts(
      altText,
      texts.filter((e) => e.state === LineState.ALT),
      gap,
      margin_top,
      margin_left
    );
  });
}
