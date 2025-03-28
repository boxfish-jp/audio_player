export class Player {
	private _queue: (() => Promise<void>)[] = [];
	private isProcessing = false;
	private constructor() {}

	private static _instance: Player;

	static instance() {
		if (!Player._instance) {
			Player._instance = new Player();
		}
		return Player._instance;
	}

	addQueue(func: () => Promise<void>) {
		this._queue.push(func);
		if (!this.isProcessing) {
			this._play();
		}
	}

	private async _play() {
		try {
			this.isProcessing = true;
			while (this._queue.length > 0) {
				const func = this._queue.shift();
				if (func) {
					await func();
				}
			}
		} finally {
			this.isProcessing = false;
		}
	}
}
