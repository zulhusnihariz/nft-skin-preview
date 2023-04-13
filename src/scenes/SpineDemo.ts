import Phaser from 'phaser';

type SpineSkin = {
	name: string;
	url: { image: string; atlas: string };
};

type DispatcherMessage = {
	message: string;
	value: any;
};

export default class SpineDemo extends Phaser.Scene {
	private spineBoy!: SpineGameObject;

	private DEFAULT_JSON = `${process.env.DEFAULT_SPINE_SKELETON_JSON}`;
	private DEFAULT_ATLAS = `${process.env.SMITH_ATLAS_URL}`;
	private DEFAULT_SPINE_KEY = 'spine_boy';
	private DEFAULT_SPINE_SKIN_NAME = 'default/default_boy'; // defined in DEFAULT_JSON
	private INITIAL_ANIMATION = 'default_boy/idle';

	// also defined in DEFAULT_JSON
	private STATE_ANIMATIONS = [
		'default_boy/idle',
		'default_boy/run',
		'default_boy/run_back',
	];

	private currentAnimationIndex = 0;

	constructor() {
		super('spine-demo');
	}

	preload() {
		this.load.spine(
			this.DEFAULT_SPINE_KEY,
			this.DEFAULT_JSON,
			this.DEFAULT_ATLAS,
			true
		);
	}

	create() {
		this.spineBoy = this.createSpineBoy();

		// initial spine created doesn't load properly (infinite height, width; skeleton data = null, etc.)
		// calling destroy and re-create the spine seems to fix it
		this.spineBoy.destroy();
		this.spineBoy = this.createSpineBoy();
		this.spineBoy.setSkinByName(this.DEFAULT_SPINE_SKIN_NAME);

		this.cameras.main.setZoom(2);
		this.cameras.main.startFollow(this.spineBoy);

		this.time.addEvent({
			delay: 5000,
			callback: () => this.playNextAnimation(),
			loop: true,
		});

		this.postMessageHandler();
	}

	private postMessageHandler() {
		window.addEventListener('message', (e) => {});

		window.onmessage = (e) => {
			let msg = e.data as DispatcherMessage;
			let data = msg.value;

			switch (msg.message) {
				case 'SET_CANVAS_DIMENSION':
					if (!data.dimension) return;

					console.log('dimensions', data.dimension);

					this.game.canvas.width = data.dimension.width;
					this.game.canvas.height = data.dimension.height;
					break;
				case 'SET_PREVIEW_SKIN':
					if (!data.skin) return;

					this.loadSpineSkin(data.skin);
					// this.setCameraFollowOffset(data.offset);
					break;
			}
		};

		window.parent.postMessage({ message: 'PREVIEW_LOADED', value: true }, '*');
	}

	private createSpineBoy() {
		const CANVAS_CENTER = {
			x: this.game.canvas.width / 2,
			y: this.game.canvas.height / 2,
		};

		const spineBoy = this.add
			.spine(
				CANVAS_CENTER.x,
				CANVAS_CENTER.y,
				this.DEFAULT_SPINE_KEY,
				this.INITIAL_ANIMATION,
				true
			)
			.setScale(2)
			.setVisible(false);

		return spineBoy;
	}

	private playNextAnimation() {
		this.currentAnimationIndex =
			(this.currentAnimationIndex + 1) % this.STATE_ANIMATIONS.length;
		this.spineBoy.play(this.STATE_ANIMATIONS[this.currentAnimationIndex], true);
	}

	private setCameraFollowOffset(offset: { x: number; y: number }) {
		this.cameras.main.setFollowOffset(offset.x, offset.y);
	}

	async loadSpineSkin(skin: SpineSkin) {
		const { url, name } = skin;

		/* load spine references:- 
		1. http://en.esotericsoftware.com/forum/Phaser-3-Multiple-atlas-on-one-skeleton-14961
		2. https://github.com/EsotericSoftware/spine-runtimes/blob/4.0/spine-ts/spine-webgl/example/mix-and-match.html#L48
		3. https://github.com/azerion/phaser-spine/blob/37c41fe880aae0d2721301dbd95a5ed73364143a/ts/Spine.ts
		*/

		/*
		1. get atlas in text form 
		2. spinePluigin.TextureAtlas -> independantly load atlas
		3. spineJsonParser.readSkeletonData() -> create skeleton data from cached spine json (loaded in preload scene) & the new atlas in 2.
		4. spinePlugin.Skin & newSkin.copySkin() -> create new skin instance & copy paste default skin attachments/bones/constraints to the new skin
		5. push the new skin to player spine.skeletonData.skins array
		6. spine.setSkinByName can be called to set the new skin
		*/

		//@ts-ignore
		let spinePlugin = this.spine.plugin;

		const res = await fetch(url.atlas);
		const atlasText = await res.text();

		let texture = window.document.createElement('IMG') as HTMLImageElement;

		texture.crossOrigin = 'anonymous';
		texture.src = url.image;

		texture.onload = () => {
			let atlas = new spinePlugin.TextureAtlas(atlasText, (path) => {
				//@ts-ignore
				let context = this.spine.sceneRenderer.context.gl; //preloadScene.game.context;
				let glTexture = new spinePlugin.webgl.GLTexture(
					context,
					texture,
					false
				);
				return glTexture;
			});

			let atlasLoader = new spinePlugin.AtlasAttachmentLoader(atlas);
			let spineJsonParser = new spinePlugin.SkeletonJson(atlasLoader);

			let cachedJson = this.game.cache.json.entries.get(this.DEFAULT_SPINE_KEY);
			let skeletonData = spineJsonParser.readSkeletonData(cachedJson);
			let defaultSkin = skeletonData.skins[0];

			let newSkin = new spinePlugin.Skin(name);

			newSkin.copySkin(defaultSkin);
			this.spineBoy.skeletonData.skins.push(newSkin); // add the new skin to spineboy skin collection;

			this.spineBoy.setSkinByName(name);
			this.spineBoy.setVisible(true);
		};
	}
}
