import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Slider } from "./components/ui/slider";

interface Volume {
	volume: number;
	channel: number;
}

async function playArrayBuffer(
	arrayBuffer: ArrayBuffer,
	audioContext: AudioContext,
) {
	const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
	const source = audioContext.createBufferSource();
	source.buffer = audioBuffer;
	source.connect(audioContext.destination);
	source.start();
}

function App(): JSX.Element {
	const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
	const [volumes, setVolumes] = useState<Volume[]>([]);

	const handleValueChange = (channel: number, volume: number) => {
		const newVolumes = [...volumes];
		newVolumes[channel] = { volume, channel };
		setVolumes(newVolumes);
	};

	const handleValueCommit = (channel: number, volume: number) => {
		const localStorageItems = localStorage.getItem("volumes");
		if (localStorageItems) {
			const items = JSON.parse(localStorageItems) as Volume[];
			const index = items.findIndex((v) => v.channel === channel);
			if (index !== -1) {
				items[index] = { volume, channel };
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
			.map((_, index) => ({ volume: 50, channel: index }));
		setVolumes(data);
		localStorage.setItem("volumes", JSON.stringify(volumes));
	};

	useEffect(() => {
		if (!audioContext) return;
		window.api.onAudio(async (audio: ArrayBuffer) => {
			await playArrayBuffer(audio, audioContext);
		});
	}, [audioContext]);

	useEffect(() => {
		const localStorageItems = localStorage.getItem("volumes");
		const data = localStorageItems
			? JSON.parse(localStorageItems)
			: Array(5)
					.fill(null)
					.map((_, index) => ({ volume: 50, channel: index }));
		setVolumes(data);

		setAudioContext(new AudioContext());
	}, []);

	return (
		<div
			className="h-screen w-full grid grid-cols-6
      items-center justify-center"
		>
			{volumes.map((v) => (
				<div
					key={v.channel}
					className="col-start-2 col-span-4 flex flex-col items-center justify-center"
				>
					<div className="text-2xl">Channel {v.channel}</div>
					<div className="text-2xl">{v.volume}</div>
					<Slider
						defaultValue={[v.volume]}
						value={[v.volume]}
						max={100}
						step={1}
						onValueChange={(value: number[]) => {
							handleValueChange(v.channel, value[0]);
						}}
						onValueCommit={(value: number[]) => {
							handleValueCommit(v.channel, value[0]);
						}}
					/>
				</div>
			))}
			<Button onClick={onReset}>Reset</Button>
		</div>
	);
}

export default App;
