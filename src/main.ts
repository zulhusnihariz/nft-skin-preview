import Phaser from 'phaser';
import 'phaser/plugins/spine/dist/SpinePlugin';

import SpineDemo from './scenes/SpineDemo';

export function GetCanvasDimensionBasedOnScreenResolution(): {
	canvasHeight: number;
	canvasWidth: number;
} {
	let canvasHeight;
	let canvasWidth;

	const isMobile =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini|Mobile/i.test(
			navigator.userAgent
		);

	if (!isMobile) {
		canvasWidth = window.innerWidth;
		canvasHeight = window.innerHeight;

		return { canvasHeight, canvasWidth };
	}

	// Take the user to a different screen here.
	const orientation = screen.orientation;

	const isPortrait = orientation.type.includes('portrait');
	const isLandscape = orientation.type.includes('landscape');

	if (isPortrait) {
		canvasWidth =
			window.innerWidth * (window.innerHeight / window.innerWidth - 0.5);
		canvasHeight =
			window.innerHeight * (window.innerHeight / window.innerWidth - 0.5);
	} else if (isLandscape) {
		canvasWidth = window.innerWidth * 2;
		canvasHeight = window.innerHeight * 2;
	}

	return { canvasHeight, canvasWidth };
}

const { canvasWidth, canvasHeight } =
	GetCanvasDimensionBasedOnScreenResolution();

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: canvasWidth,
	height: canvasHeight,
	parent: 'parent',
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 200 },
		},
	},
	scene: [SpineDemo],
	plugins: {
		scene: [
			{ key: 'SpinePlugin', plugin: window.SpinePlugin, mapping: 'spine' },
		],
	},
};

export default new Phaser.Game(config);
