export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  // index.css already provides the base reset; preflight would undo h1/h2/h3 weights.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        line: "var(--line)",
        accent: "var(--accent)",
        danger: "var(--danger)",
      },
    },
  },
  plugins: [],
};
