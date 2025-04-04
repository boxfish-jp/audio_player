import { serve } from "@hono/node-server";
import { type BrowserWindow, ipcMain } from "electron";
import { Hono } from "hono";

export const startServer = (window: BrowserWindow) => {
	const restapi = new Hono();
	restapi.get("/", async (c) => {
		return c.text("hello Node.js!");
	});

	restapi.post("/", async (c) => {
		const audio = await c.req.arrayBuffer();
		const channel = c.req.query("channel");
		window.webContents.send("audio", {
			channel: channel ? Number(channel) : 0,
			audio,
		});
		await new Promise<string>((resolve) => {
			const timeout = setTimeout(() => resolve("timeout"), 30000);
			ipcMain.once("finish", () => {
				clearTimeout(timeout);
				resolve("finish");
			});
		});
		return c.text("ok");
	});

	serve({
		fetch: restapi.fetch,
		port: 8686,
	});
};
