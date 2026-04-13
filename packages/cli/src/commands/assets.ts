import { defineCommand } from "citty";
import { assetsSearch } from "./assets-search.js";
import { assetsOrderbook } from "./assets-orderbook.js";

export { assetsSearch } from "./assets-search.js";
export { assetsOrderbook } from "./assets-orderbook.js";

export const assetsCommand = defineCommand({
  meta: { name: "assets", description: "Search assets and view orderbooks on Stellar" },
  subCommands: {
    search: assetsSearch,
    orderbook: assetsOrderbook,
  },
});
