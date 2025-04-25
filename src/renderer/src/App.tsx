import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./components/ui/select";
import { Slider } from "./components/ui/slider";
import { AudioDeviceManager } from "./lib/audio_device";
import { readAudioSettings, writeAudioSettings } from "./lib/local_storage";
import type { AudioDevice, AudioSetting } from "./lib/types";
import { Player } from "./player";

function App(): JSX.Element {
	const [audioSettings, setAudioSettings] =
		useState<AudioSetting[]>(readAudioSettings);
	const [player] = useState<Player>(Player.instance);
	const [deviceLists, setdeviceLists] = useState<AudioDevice[]>([]);
	const [deviceManager] = useState(AudioDeviceManager.instance);

	// デバイス一覧を取得
	useEffect(() => {
		deviceManager.refreshDevices().then((lists) => {
			setdeviceLists(lists);
		});
	}, [deviceManager]);

	const handleValueChange = (
		deviceId: string,
		channel: number,
		volume: number,
		isMute: boolean,
	) => {
		const index = audioSettings.findIndex((v) => v.channel === channel);
		const newAudioSettings = [...audioSettings];
		if (index !== -1) {
			newAudioSettings[index] = { deviceId, volume, channel, isMute };
		}
		setAudioSettings(newAudioSettings);
		console.log("change", index);
	};

	const handleValueCommit = (
		deviceId: string,
		channel: number,
		volume: number,
		isMute: boolean,
	) => {
		const index = audioSettings.findIndex((v) => v.channel === channel);
		const newAudioSettings = [...audioSettings];
		if (index !== -1) {
			newAudioSettings[index] = { deviceId, volume, channel, isMute };
		}
		writeAudioSettings(newAudioSettings);
		setAudioSettings(newAudioSettings);
		console.log("commit");
	};

	const onReset = () => {
		localStorage.removeItem("audioSettings");
		const data = Array(5)
			.fill(null)
			.map((_, index) => ({
				deviceId: "default",
				volume: 50,
				channel: index,
				isMute: false,
			}));
		setAudioSettings(data);
		writeAudioSettings(data);
	};

	useEffect(() => {
		const func = async (value: {
			channel: number;
			audio: ArrayBuffer;
		}) => {
			const volume = audioSettings[value.channel].isMute
				? 0
				: audioSettings[value.channel].volume;
			const deviceId = audioSettings[value.channel].deviceId;
			if (player) {
				await player.addQueue(deviceId, value.audio, volume, async () => {
					window.api.onFinish(true);
				});
			}
		};
		const remove = window.api.onAudio(func);
		return () => {
			console.log("unmount");
			remove();
		};
	}, [audioSettings, player]);

	return (
		<div className="h-screen w-full flex flex-col gap-4 py-5 items-center">
			<div
				className="h-screen w-full grid grid-cols-6
        items-center justify-center gap-5"
			>
				{audioSettings.map((v) => (
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
								handleValueChange(v.deviceId, v.channel, v.volume, !v.isMute);
							}}
						>
							{v.isMute ? "Unmute" : "Mute"}
						</Button>

						{/* デバイス選択用のセレクトボックス */}
						<div className="col-span-6 mb-2">
							<Select
								value={v.deviceId}
								onValueChange={(value) =>
									handleValueCommit(value, v.channel, v.volume, v.isMute)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="出力デバイスを選択" />
								</SelectTrigger>
								<SelectContent>
									{deviceLists.map((device) => (
										<SelectItem key={device.deviceId} value={device.deviceId}>
											{device.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<Slider
							className="col-span-6"
							defaultValue={[v.volume]}
							value={v.isMute ? [0] : [v.volume]}
							disabled={v.isMute}
							max={200}
							step={1}
							onValueChange={(value: number[]) => {
								handleValueChange(v.deviceId, v.channel, value[0], v.isMute);
							}}
							onValueCommit={(value: number[]) => {
								handleValueCommit(v.deviceId, v.channel, value[0], v.isMute);
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
