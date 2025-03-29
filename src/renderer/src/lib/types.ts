export interface Volume {
	volume: number;
	channel: number;
	isMute: boolean;
}

export interface AudioModule {
	audioContext: AudioContext;
	gainNode: GainNode;
}
