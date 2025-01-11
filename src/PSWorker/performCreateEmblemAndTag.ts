import { ServerSocket } from "../ServerSocket";
import { collapseLayer } from "./collapseLayer";
import { Line, LineState } from "./Model";

export async function performCreateEmblemAndTag(
  lines: Line[],
  socket: ServerSocket
) {
  const emblems = lines.filter((e) => e.state === LineState.EMBLEM);
  const tags = lines.filter((e) => e.state === LineState.TAG);
  if (emblems.length > 0) {
    for await (const emblem of emblems) {
      socket.sendMessage({
        type: "create_emblem",
        fromserver: false,
        data: emblem.value,
        template_index: -1,
      });
    }
  }
  if (tags.length > 0) {
    for await (const tag of tags) {
      socket.sendMessage({
        type: "create_emblem",
        fromserver: false,
        data: tag.value,
        template_index: -1,
      });
    }
  }

  await collapseLayer("masterlayer", false, true);
}
