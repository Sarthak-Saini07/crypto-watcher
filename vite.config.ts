// // import { defineConfig } from "vite";
// // import react from "@vitejs/plugin-react-swc";
// // import path from "path";
// // import { componentTagger } from "lovable-tagger";

// // // https://vitejs.dev/config/
// // export default defineConfig(({ mode }) => ({
// //   server: {
// //     host: "::",
// //     port: 8080,
// //   },
// //   plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
// //   resolve: {
// //     alias: {
// //       "@": path.resolve(__dirname, "./src"),
// //     },
// //   },
// // }));
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react-swc";
// import path from "path";
// import { componentTagger } from "lovable-tagger";
// import { visualizer } from "rollup-plugin-visualizer"; // ✅ add this import

// // https://vitejs.dev/config/
// export default defineConfig(({ mode }) => ({
//   server: {
//     host: "::",
//     port: 8080,
//   },
//   plugins: [
//     react(),
//     mode === "development" && componentTagger(),
//     // ✅ only add visualizer in production builds
//     mode === "production" &&
//       visualizer({
//         filename: "dist/stats.html",
//         template: "treemap", // "treemap", "sunburst", or "network"
//         gzipSize: true,
//         brotliSize: true,
//       }),
//   ].filter(Boolean),

//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
//      build: {
//     rollupOptions: {
//       output: {
//         manualChunks(id) {
//           if (!id.includes("node_modules")) return;
//           // heavy optional libraries that can be safely split
//           if (id.includes("recharts")) return "charts";
//           if (id.includes("framer-motion")) return "motion-vendor";
//           if (id.includes("lucide-react")) return "icons-vendor";
//           // keep everything else (including react/react-dom) together in vendor
//           return "vendor";
//         },
//       },
//     },
//   },

//   // build: {
//   //   rollupOptions: {
//   //     output: {
//   //       // ✅ Split large libraries into separate chunks
//   //       manualChunks(id) {
//   //         if (id.includes("node_modules")) {
//   //           if (id.includes("react") || id.includes("react-dom")) return "react-vendor";
//   //           if (id.includes("framer-motion")) return "motion-vendor";
//   //           if (id.includes("lucide-react")) return "icons-vendor";
//   //           if (id.includes("chart") || id.includes("recharts")) return "charts";
//   //           return "vendor";
//   //         }
//   //       },
//   //     },
//   //   },
//   },
// }));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "./", // ensure relative asset paths for static serving
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // only run visualizer in production builds
    mode === "production" &&
      visualizer({
        filename: "dist/stats.html",
        template: "treemap",
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // safer manualChunks: split big optional libs but keep react/react-dom in vendor
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts")) return "charts";
          if (id.includes("framer-motion")) return "motion-vendor";
          if (id.includes("lucide-react")) return "icons-vendor";
          return "vendor";
        },
      },
    },
  },
}));

