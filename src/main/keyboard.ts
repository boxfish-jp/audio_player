import { globalShortcut } from "electron/main";

export const addKeyboardEventListenner = () => {
	const shortcuts: { [key: string]: string } = {
		F13: "http://localhost:2525?inst=talk",
		F14: "http://localhost:2525/interrupt",
		F15: "http://localhost:2525?inst=progress",
		F16: "http://localhost:2525?inst=cli",
	};

	for (const [key, url] of Object.entries(shortcuts)) {
		const ret = globalShortcut.register(key, () => {
			sendPostRequest(url, key);
		});

		if (!ret) {
			console.error(`${key} shortcutKey failed`);
		} else {
			console.log(`${key} shortcutKey success`);
		}
	}
};

async function sendPostRequest(
	url: string,
	shortcutKey: string,
): Promise<void> {
	try {
		const response: Response = await fetch(url, {
			method: "POST",
			headers: {},
		});

		if (response.ok) {
		} else {
			try {
				const errorBody: string = await response.text();
				console.error(`[${shortcutKey}] error body:`, errorBody);
			} catch (bodyError: unknown) {
				const message =
					bodyError instanceof Error ? bodyError.message : String(bodyError);
				console.error(`[${shortcutKey}] response body parse failed`, message);
			}
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.log(message);
	}
}
