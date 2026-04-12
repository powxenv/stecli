import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    exports: true,
    banner: { js: "#!/usr/bin/env node\n" },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
