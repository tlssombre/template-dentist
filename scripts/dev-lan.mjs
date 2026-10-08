process.env.LAN_PREVIEW = "1";
process.argv = [process.execPath, import.meta.filename, "dev"];
await import("./run-framework.mjs");
