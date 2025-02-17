export class Player {
	private _queue: (() => Promise<void>)[] = [];
	private isProcessing = false;

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
