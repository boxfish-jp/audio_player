import type { AudioSetting } from "./types";

export const readAudioSettings = () => {
	const localStorageItems = localStorage.getItem("audioSettings");
	return localStorageItems
		? (JSON.parse(localStorageItems) as AudioSetting[])
		: Array(5)
				.fill(null)
				.map((_, index) => ({
					deviceId: "default",
					volume: 50,
					channel: index,
					isMute: false,
				}));
};

export const writeAudioSettings = (outputSettings: AudioSetting[]) => {
	const localStorageItems = localStorage.getItem("audioSettings");
	if (localStorageItems) {
		localStorage.setItem("outputSetting", JSON.stringify(outputSettings));
	}
};
