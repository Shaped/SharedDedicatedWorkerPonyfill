// (C) 2022 Jai B. Shaped Technologies www.shaped.ca
// MIT license

export class SharedDedicatedWorkerPonyfill {
	#broadcastTimeout;
	#autoStartPort;

	constructor(url, opts, autoStartPort = true, forceDedicated = false) {
		this.#broadcastTimeout = 1000;
		this.#autoStartPort = autoStartPort;

		this.url = url;
		this.opts = opts || {};

		if (!this.opts?.name)
			this.opts.name = url;

		this.mbus = new BroadcastChannel(`_sharedWorkerBus:${url}`);
		this.mbus.url = this.url;

		this.sharedWorkerSupported = "SharedWorker" in globalThis;

		if (forceDedicated) this.sharedWorkerSupported = false;

		return (async()=>{
			await this.createAttachWorker();
			return this;
		})();
	}

	async createAttachWorker() {
		if (this.sharedWorkerSupported) {
			this.worker = new SharedWorker(this.url, this.opts);
			(this.#autoStartPort)?this.worker.port.start():null;
		} else {
			try {
				this.worker = await this.findExistingWorker();
				this.worker.port = this.mbus;
			} catch(e) {
				if (e == 'noWorker') {
					this.worker = new Worker(this.url, this.opts);
					this.worker.port = this.mbus;
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
		return (this.sharedWorkerSupported)
		?this.worker.port.postMessage(message,transfer)
		:(this.worker?.local)
			?this.worker.postMessage(message, transfer)
			:(transfer)
				?(function(){throw new Error(`Worker not in local context; transfer impossible`)})()
				:this.mbus.postMessage(message);
	}

	start() {
		(this.sharedWorkerSupported)
		?this.worker.port.start()
		:null;
	}

	terminate() {
		return (this.sharedWorkerSupported)
		?this.worker.port.close()
		:this.worker.terminate();
	}

	close() { return this.terminate(); }

	get onmessage() { return this.worker.port.onmessage; }
	set onmessage(_) { this.worker.port.onmessage = _; }

	get onmessageerror() { return this.worker.port.onmessageerror; }
	set onmessageerror(_) {	this.worker.port.onmessageerror = _; }

	get port() { return this.worker.port; }

	get onerror() { return this.worker.onerror; }
	set onerror(_) { this.worker.onerror = _; }

	dispatchEvent(_) { return this.worker.dispatchEvent(_); }

	addEventListener(type, listener, options) {
		return this.worker.port.addEventListener(type, listener, options);
	}

	removeEventListener(type, listener, options) {
		return this.worker.port.removeEventListener(type, listener, options);
	}
}
