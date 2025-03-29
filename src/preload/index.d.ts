import type { ElectronAPI, IpcRenderer } from "@electron-toolkit/preload";

declare global {
	interface Window {
		electron: ElectronAPI;
		api: {
			onAudio: (
				callback: (value: {
					channel: number;
					audio: ArrayBuffer;
				}) => Promise<void>,
			) => () => void;
			onFinish: (finish: boolean) => void;
		};
	}
}
