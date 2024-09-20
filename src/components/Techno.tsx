import { log } from '~/lib/log'
import { isServer } from 'solid-js/web'
import { onCleanup } from 'solid-js'
import { createTimer } from '@solid-primitives/timer'
import { createShortcut } from '@solid-primitives/keyboard'

import './Techno.css'

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

export default function Techno() {
	let ctx: AudioContext
	let worklet: AudioWorkletNode

	async function addModule() {
		if (!ctx) {
			await init()
		}

		if (worklet) {
			worklet.disconnect()
		}

		// Idea for reloading - fetch the module, replace techno-processor with something else,
		// use data: url to load it
		await ctx.audioWorklet.addModule('TechnoProcessor.js')
		worklet = new AudioWorkletNode(ctx, 'techno-processor')
		worklet.connect(ctx.destination)
	}

	async function init() {
		if (ctx) {
			return
		}

		if (isServer) {
			throw new Error('should not run on server')
		}

		ctx = new AudioContext({ sampleRate: 48000 })
		await addModule()
	}

	async function play() {
		log('play')

		await init()
		await ctx.resume()
	}

	async function pause() {
		log('pause')

		await init()
		await ctx.suspend()
	}

	async function refresh() {
		// await sleep(200)

		// Reloading module doesn't work
		// await addModule()

		window.location.reload()
	}

	onCleanup(async () => {
		// Avoid multiple audio players playing when hot reloading
		if (isServer) {
			return
		}

		log('cleanup')

		if (worklet) {
			worklet.disconnect()
		}

		if (ctx) {
			await ctx.suspend()
		}
	})

	createTimer(() => {
		if (ctx) {
			// chrome: 0.016 consistently
			console.log('output latency', ctx.outputLatency)
		}
	}, 1000, setInterval)

	createShortcut(['P'], play)
	createShortcut(['R'], refresh)

	return (
		<div class="Techno">
			<button onClick={play}><em>p</em>lay</button>
			<button onClick={pause}>pause</button>
			<button onClick={refresh}><em>r</em>eload page</button>
		</div>
	)
}
