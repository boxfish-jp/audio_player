import { useState } from "react";

function Versions(): JSX.Element {
	const [versions] = useState(window.electron.process.versions);

	return (
		<ul className="versions">
			<li className="electron-version">Electronsds v{versions.electron}</li>
			<li className="chrome-version">Chromium v{versions.chrome}</li>
			<li className="node-version">Node v{versions.node}</li>
		</ul>
	);
}

export default Versions;
