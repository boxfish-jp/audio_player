import type { Volume } from "./types";

export const getVolumeFromStorage = () => {
	const localStorageItems = localStorage.getItem("volumes");
	return localStorageItems
		? (JSON.parse(localStorageItems) as Volume[])
		: Array(5)
				.fill(null)
				.map((_, index) => ({ volume: 50, channel: index, isMute: false }));
};

export const setVolumeToStorage = (volumes: Volume[]) => {
	const localStorageItems = localStorage.getItem("volumes");
	if (localStorageItems) {
		localStorage.setItem("volumes", JSON.stringify(volumes));
	}
};
