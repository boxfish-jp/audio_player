import { type AudioDevice, AudioDeviceManager } from "./lib/audio_device";

export class Player {
	private _queue: AudioController[] = [];
	private _isProcessing = false;
	private _audioContext: AudioContext;
	private _gainNode: GainNode;
	private _deviceManager: AudioDeviceManager;
	private _channelDevices: Map<number, string> = new Map(); // チャンネルごとのデバイスID

	private constructor() {
		this._audioContext = new AudioContext();
		this._gainNode = this._audioContext.createGain();
		this._deviceManager = AudioDeviceManager.instance();

		for (let i = 0; i < 5; i++) {
			this._channelDevices.set(i, "default");
		}
	}

	private static _instance: Player;

	static instance() {
		if (!Player._instance) {
			Player._instance = new Player();
		}
		return Player._instance;
	}

	async addQueue(
		audioData: ArrayBuffer,
		volume: number,
		channelNumber: number,
		onEnded: () => Promise<void>,
	) {
		const deviceId = this._channelDevices.get(channelNumber) || "default";
		const audio = new AudioController(
			this._audioContext,
			this._gainNode,
			audioData,
			volume,
			deviceId,
		);
		audio.onEnded = onEnded;
		this._queue.push(audio);
		this._play();
	}

	setChannelDevice(channel: number, deviceId: string) {
		this._channelDevices.set(channel, deviceId);
	}

	getChannelDevice(channel: number): string {
		return this._channelDevices.get(channel) || "default";
	}

	saveDeviceSettings() {
		const settings = Array.from(this._channelDevices.entries()).reduce(
			(obj, [channel, deviceId]) => {
				obj[channel] = deviceId;
				return obj;
			},
			{} as Record<number, string>,
		);

		localStorage.setItem("channelDevices", JSON.stringify(settings));
	}

	loadDeviceSettings() {
		const settings = localStorage.getItem("channelDevices");
		if (settings) {
			const parsed = JSON.parse(settings) as Record<number, string>;
			for (const [channel, deviceId] of Object.entries(parsed)) {
				this._channelDevices.set(Number(channel), deviceId);
			}
		}
	}

	private async _play() {
		if (!this._isProcessing) {
			try {
				this._isProcessing = true;
				while (this._queue.length > 0) {
					const audio = this._queue.shift();
					if (audio) {
						await audio.play();
					}
				}
			} finally {
				this._isProcessing = false;
			}
		}
	}
}

class AudioController {
	private _audioContext: AudioContext;
	private _gainNode: GainNode;
	private _audioData: ArrayBuffer;
	private _volume: number;
	private _deviceId: string;
	private _onEnded: () => Promise<void> = async () => {};

	constructor(
		audioContext: AudioContext,
		gainNode: GainNode,
		audiodata: ArrayBuffer,
		volume: number,
		deviceId = "default",
	) {
		this._audioContext = audioContext;
		this._gainNode = gainNode;
		this._audioData = audiodata;
		this._volume = volume;
		this._deviceId = deviceId;
	}

	set onEnded(onEnded: () => Promise<void>) {
		this._onEnded = onEnded;
	}

	public async play() {
		const source = this._audioContext.createBufferSource();
		try {
			const audioBuffer = await this._audioContext.decodeAudioData(
				this._audioData,
			);
			source.buffer = audioBuffer;
			this._gainNode.gain.setValueAtTime(
				this._volume / 50,
				this._audioContext.currentTime,
			);
			const destination = this._audioContext.createMediaStreamDestination();

			// 接続: source -> gainNode -> destination
			source.connect(this._gainNode);
			this._gainNode.connect(destination);

			// AudioElementを作成して特定のデバイスに出力
			const audioEl = new Audio();
			audioEl.srcObject = destination.stream;

			// デバイスIDが指定されている場合は出力先を設定
			if (this._deviceId && "setSinkId" in audioEl) {
				try {
					await audioEl.setSinkId(this._deviceId);
				} catch (error) {
					console.error(
						`デバイス(${this._deviceId})への出力設定に失敗しました:`,
						error,
					);
					// エラー時はデフォルトデバイスを使用
				}
			}

			// 再生開始
			source.start();
			await audioEl.play();

			await new Promise<void>((resolve) => {
				source.onended = async () => {
					await this._onEnded();
					audioEl.pause();
					audioEl.srcObject = null;
					resolve();
				};
			});
		} catch (error) {
			console.error(error);
		}
	}
}
