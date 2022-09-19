// (C) 2022 Jai B. Shaped Technologies www.shaped.ca
// https://github.com/Shaped/SharedDedicatedWorkerPonyfill
// MIT license

export class SharedDedicatedWorkerPonyfill {
	#broadcastTimeout;
	#autoStartPort;
	#preferBroadcast;
	#forceDedicated;

	constructor(workerURL, workerOpts = {}, fillOpts = {}) {
		if (typeof workerURL === 'undefined' || workerURL == '')
			throw new Error(`Invalid URL for SharedDedicatedWorker`);

		this.sharedWorkerSupported = "SharedWorker" in globalThis;

		this.#broadcastTimeout = fillOpts?.broadcastTimeout || 1000;
		this.#preferBroadcast = (typeof fillOpts?.preferBroadcast !== 'undefined') ? fillOpts.preferBroadcast : true;
		this.#autoStartPort = (typeof fillOpts?.autoStartPort !== 'undefined') ? fillOpts.autoStartPort : true;
		this.#forceDedicated = (typeof fillOpts?.forceDedicated !== 'undefined') ? fillOpts.forceDedicated : false;

		this.url = workerURL;
		this.opts = workerOpts || {};

		if (!this.opts?.name) this.opts.name = workerURL;

		if (this.#preferBroadcast)
			this.opts.name = `#${this.opts.name}`;

		this.mbusName = `_sharedWorkerBus:${this.opts.name}`;

		this.mbus = new BroadcastChannel(this.mbusName);
		this.mbus.url = this.url;

		 (this.#forceDedicated)?this.sharedWorkerSupported=false:null;

		return (async()=>{
			await this.createAttachWorker();
		  return this;
		})();
	}

	async createAttachWorker() {
		if (this.sharedWorkerSupported) {
			this.worker = await new SharedWorker(this.url, this.opts);
			(this.#autoStartPort)?this.worker.port.start():null;
		} else {
			try {
				this.worker = await this.findExistingWorker();
				this.worker.port = this.mbus;
			} catch(e) {
				if (e == 'noWorker') {
					this.worker = new Worker(this.url, this.opts);
					this.worker.port = this.mbus; // dedicated workers have no 'port', can send direct or use broadcast, so set port to broadcast
					this.worker.local = true;
				} else {
					throw new Error("SharedDedicatedWorkerPonyfill : SharedWorkeNotSupported: error creating new Worker", e);
				}
			}
		}
	}

	findExistingWorker(url) {
		return new Promise((res,rej) => {
			let mbt = setTimeout(()=>{
				this.mbus.removeEventListener('message', mBh);
				rej('noWorker');
			}, this.#broadcastTimeout);

			let mBh = (ev)=>{
				switch (ev.data.x) {
					case '🔔':
						if (ev.data.url == this.url) {
							clearTimeout(mbt);
							res(this);
						}
					  break;
					default:
						clearTimeout(mbt);
						rej('workerError');
				}
			}

			this.mbus.addEventListener('message', mBh, {once:true});

			this.mbus.postMessage({
				x: `🔔`,
				url
			});
		});
	}

	postMessage(message, transfer) {
		(this.sharedWorkerSupported)
		?this.port.postMessage(message, transfer)
		:(!this.#preferBroadcast && this.worker?.local)
			?this.port.postMessage(message, transfer)
			:(transfer)
				?(function(){throw new Error(`Worker not in local context or preferBroadcast enabled, transfer impossible!`)})()
				:this.port.postMessage(message);
	}

	start() {
		(this.sharedWorkerSupported && !this.#preferBroadcast)
		?this.worker.port.start()
		:null;
	}

	terminate() {
		return (this.sharedWorkerSupported)
		?this.port.close()
		:this.worker.terminate();
	}

	close() { return this.terminate(); }

	get _port() {
		return (this.sharedWorkerSupported)
		? this.worker.port
		: (this.worker?.local)
		? this.worker
		: (function() { throw new Error(`Actual worker is not a SharedWorker or a local DedicatedWorker, unable to retreive underlying port`) });
	}

	get port() {
		return (this.#preferBroadcast)
		?this.mbus
		:(this.worker?.local)
			?this.worker
			:this.worker.port;
	}

	get onmessage() { return this.worker.port.onmessage; }
	set onmessage(_) { this.worker.port.onmessage = _; }

	get onmessageerror() { return this.worker.port.onmessageerror; }
	set onmessageerror(_) {	this.worker.port.onmessageerror = _; }

	get onerror() { return this.worker.port.onerror; }
	set onerror(_) { this.worker.port.onerror = _; }

	dispatchEvent(_) { return this.worker.port.dispatchEvent(_); }

	addEventListener(type, listener, options) {
		return this.port.addEventListener(type, listener, options);
	}

	removeEventListener(type, listener, options) {
		return this.port.removeEventListener(type, listener, options);
	}
}
