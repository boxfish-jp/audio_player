import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Slider } from "./components/ui/slider";
import { getVolumeFromStorage, setVolumeToStorage } from "./lib/local_storage";
import type { Volume } from "./lib/types";
import { Player } from "./player";

function App(): JSX.Element {
	const [volumes, setVolumes] = useState<Volume[]>(getVolumeFromStorage);
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
		const index = volumes.findIndex((v) => v.channel === channel);
		const newVolumes = [...volumes];
		if (index !== -1) {
			newVolumes[index] = { volume, channel, isMute };
		}
		setVolumeToStorage(newVolumes);
		setVolumes(newVolumes);
	};

	const onReset = () => {
		localStorage.removeItem("volumes");
		const data = Array(5)
			.fill(null)
			.map((_, index) => ({ volume: 50, channel: index, isMute: false }));
		setVolumes(data);
		setVolumeToStorage(data);
	};

	useEffect(() => {
		const func = async (value: {
			channel: number;
			audio: ArrayBuffer;
		}) => {
			const volume = volumes[value.channel].isMute
				? 0
				: volumes[value.channel].volume;
			if (player) {
				await player.addQueue(value.audio, volume, async () => {
					window.api.onFinish(true);
				});
			}
		};
		const remove = window.api.onAudio(func);
		return () => {
			console.log("unmount");
			remove();
		};
	}, [volumes, player]);

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
