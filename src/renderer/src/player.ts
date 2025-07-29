export class Player {
	private _queue: AudioController[] = [];
	private _isProcessing = false;
	private _audioContext: AudioContext;
	private _gainNode: GainNode;

	private constructor() {
		this._audioContext = new AudioContext();
		this._gainNode = this._audioContext.createGain();
	}

	private static _instance: Player;

	static instance() {
		if (!Player._instance) {
			Player._instance = new Player();
		}
		return Player._instance;
	}

	async addQueue(
		deviceId: string,
		audioData: ArrayBuffer,
		volume: number,
		onEnded: () => Promise<void>,
	) {
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

	private async _play() {
		if (!this._isProcessing) {
			try {
				this._isProcessing = true;
				while (this._queue.length > 0) {
					const audio = this._queue.shift();
					if (audio) {
						await audio.play();
						await audio.onEnded();
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

	get onEnded() {
		return this._onEnded;
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

			try {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				await (this._audioContext as any).setSinkId(this._deviceId);
			} catch (error) {
				console.error(
					`デバイス(${this._deviceId})への出力設定に失敗しました:`,
					error,
				);
			}

			source.connect(this._gainNode);
			this._gainNode.connect(this._audioContext.destination);

			source.start();

			const timeout = setTimeout(() => {
				throw new Error("Audio playback timed out after 30 seconds");
			}, 30000);
			await new Promise<void>((resolve) => {
				source.onended = async () => {
					resolve();
				};
			});
			clearTimeout(timeout);
		} catch (error) {
			console.error(error);
		} finally {
			// ノード間の接続を解除
			this._gainNode.disconnect();
			source.disconnect();

			/*
			// AudioContext を終了
			if (this._audioContext.state !== "closed") {
				this._audioContext.close();
			}
      */
		}
	}
}
