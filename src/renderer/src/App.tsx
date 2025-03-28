import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Slider } from "./components/ui/slider";
import { Player } from "./player";

interface Volume {
	volume: number;
	channel: number;
	isMute: boolean;
}

interface AudioModule {
	audioContext: AudioContext;
	gainNode: GainNode;
}

async function playArrayBuffer(
	arrayBuffer: ArrayBuffer,
	audioContext: AudioContext,
	gainNode: GainNode,
	volume: number,
) {
	const source = audioContext.createBufferSource();
	source.connect(gainNode);
	gainNode.connect(audioContext.destination);
	try {
		const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
		source.buffer = audioBuffer;
		gainNode.gain.setValueAtTime(volume / 50, audioContext.currentTime);
		source.start();

		await new Promise<void>((resolve) => {
			source.onended = () => {
				resolve();
			};
		});
	} catch (error) {
		console.error(error);
	}
}

function App(): JSX.Element {
	const [audioMoule, setAudioModule] = useState<AudioModule | null>(null);
	const [volumes, setVolumes] = useState<Volume[]>([]);
	const [player] = useState<Player>(Player.instance);

	const handleValueChange = (
		channel: number,
		volume: number,
		isMute: boolean,
	) => {
		const newVolumes = [...volumes];
		newVolumes[channel] = { volume, channel, isMute };
		setVolumes(newVolumes);
	};

	const handleValueCommit = (
		channel: number,
		volume: number,
		isMute: boolean,
	) => {
		const localStorageItems = localStorage.getItem("volumes");
		if (localStorageItems) {
			const items = JSON.parse(localStorageItems) as Volume[];
			const index = items.findIndex((v) => v.channel === channel);
			if (index !== -1) {
				items[index] = { volume, channel, isMute };
				localStorage.setItem("volumes", JSON.stringify(items));
			}
			return;
		}
		const newVolumes = [...volumes];
		localStorage.setItem("volumes", JSON.stringify(newVolumes));
	};

	const onReset = () => {
		localStorage.removeItem("volumes");
		const data = Array(5)
			.fill(null)
			.map((_, index) => ({ volume: 50, channel: index, isMute: false }));
		setVolumes(data);
		localStorage.setItem("volumes", JSON.stringify(volumes));
	};

	useEffect(() => {
		if (audioMoule) {
			const func = async (value: {
				channel: number;
				audio: ArrayBuffer;
			}) => {
				const volume = volumes[value.channel].isMute
					? 0
					: volumes[value.channel].volume;
				if (player) {
					player.addQueue(async () => {
						await playArrayBuffer(
							value.audio,
							audioMoule.audioContext,
							audioMoule.gainNode,
							volume,
						);
					});
				}
			};
			const remove = window.api.onAudio(func);
			return () => {
				console.log("unmount");
				remove();
			};
		}
		return () => {};
	}, [audioMoule, volumes, player]);

	useEffect(() => {
		const localStorageItems = localStorage.getItem("volumes");
		const data = localStorageItems
			? JSON.parse(localStorageItems)
			: Array(5)
					.fill(null)
					.map((_, index) => ({ volume: 50, channel: index }));
		setVolumes(data);

		const audioContext = new AudioContext();
		const gainNode = audioContext.createGain();

		setAudioModule({
			audioContext,
			gainNode: gainNode,
		});
	}, []);

	return (
		<div className="h-screen w-full flex flex-col gap-4 py-5 items-center">
			<div
				className="h-screen w-full grid grid-cols-6
      items-center justify-center gap-5"
			>
				{volumes.map((v) => (
					<div
						key={v.channel}
						className="col-start-2 col-span-4 grid grid-cols-6 items-center justify-center gap-2"
					>
						<div className="text-xl col-span-1">Ch {v.channel}</div>
						<div className="text-2xl col-start-3 mx-auto">
							{v.isMute ? 0 : v.volume}
						</div>
						<Button
							className="col-start-6 ms-auto"
							onClick={() => {
								handleValueChange(v.channel, v.volume, !v.isMute);
							}}
						>
							{v.isMute ? "Unmute" : "Mute"}
						</Button>
						<Slider
							className="col-span-6"
							defaultValue={[v.volume]}
							value={v.isMute ? [0] : [v.volume]}
							disabled={v.isMute}
							max={200}
							step={1}
							onValueChange={(value: number[]) => {
								handleValueChange(v.channel, value[0], v.isMute);
							}}
							onValueCommit={(value: number[]) => {
								handleValueCommit(v.channel, value[0], v.isMute);
							}}
						/>
					</div>
				))}
			</div>
			<Button className="w-fit" onClick={onReset}>
				Reset
			</Button>
		</div>
	);
}

export default App;
