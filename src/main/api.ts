import { serve } from "@hono/node-server";
import type { BrowserWindow } from "electron";
import { Hono } from "hono";

export const startServer = (window: BrowserWindow) => {
	const restapi = new Hono();
	restapi.get("/", async (c) => {
		return c.text("hello Node.js!");
	});

	restapi.post("/", async (c) => {
		const audio = await c.req.arrayBuffer();
		window.webContents.send("audio", audio);
		return c.text("ok");
	});

	serve({
		fetch: restapi.fetch,
		port: 8787,
	});
};
