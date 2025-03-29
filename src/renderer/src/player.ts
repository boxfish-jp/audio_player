export class Player {
	private _queue: Audio[] = [];
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
		audioData: ArrayBuffer,
		volume: number,
		onEnded: () => Promise<void>,
	) {
		const audio = new Audio(
			this._audioContext,
			this._gainNode,
			audioData,
			volume,
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
					}
				}
			} finally {
				this._isProcessing = false;
			}
		}
	}
}

class Audio {
	private _audioContext: AudioContext;
	private _gainNode: GainNode;
	private _audioData: ArrayBuffer;
	private _volume: number;
	private _onEnded: () => Promise<void> = async () => {};

	constructor(
		audioContext: AudioContext,
		gainNode: GainNode,
		audiodata: ArrayBuffer,
		volume: number,
	) {
		this._audioContext = audioContext;
		this._gainNode = gainNode;
		this._audioData = audiodata;
		this._volume = volume;
	}

	set onEnded(onEnded: () => Promise<void>) {
		this._onEnded = onEnded;
	}

	public async play() {
		const source = this._audioContext.createBufferSource();
		source.connect(this._gainNode);
		this._gainNode.connect(this._audioContext.destination);
		try {
			const audioBuffer = await this._audioContext.decodeAudioData(
				this._audioData,
			);
			source.buffer = audioBuffer;
			this._gainNode.gain.setValueAtTime(
				this._volume / 50,
				this._audioContext.currentTime,
			);
			source.start();

			await new Promise<void>((resolve) => {
				source.onended = async () => {
					await this._onEnded();
					resolve();
				};
			});
		} catch (error) {
			console.error(error);
		}
	}
}
