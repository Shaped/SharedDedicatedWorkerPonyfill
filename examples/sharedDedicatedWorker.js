// example sharedDedicatedWorker
/*
 note that some of this is required:
 in order for other contexts/tabs/etc to be able to know
 if a worker is running to decide whether one needs to be
 launched, this worker must respond as shown in mbusHandler
 this is only required for filled workers and not actual
 sharedWorkers of course.

 this can be improved and it might be better to default to
 using the BroadcastChannel API in both filled and non-filled
 and only use ports directly if needed or using a real
 SharedWorker.
*/

class sharedWorker {
	#preferBroadcast;

	constructor(port) {
		this.#preferBroadcast = (self.name.startsWith(`#`))?true:false;

		this.mbus = new BroadcastChannel(`_sharedWorkerBus:${self.name}`);
		this.mbus.addEventListener('message', this.mbusHandler.bind(this));

		console.log('[Worker] Worker has Started; these messages sometimes gets duplicated!');
		console.log('[Worker] Another Message that may get duplicated');

		if ("SharedWorkerGlobalScope" in self) {
			this._port = port;
			this._port.start();
		}

		if ("SharedWorkerGlobalScope" in self) {
			this._port.addEventListener('message', this.portHandler.bind(this));
		} else {
			self.addEventListener('message', this.directHandler.bind(this));
		}

		console.log('[Worker] ANother message that may get duped: Maybe more likely with more messages?');

		setTimeout(()=>{
			// this only gets sent once even when console messages duplicate,
			// thus probably not calling code twice.
			this.port.postMessage({x:'test'});
		},2500);
	}

	get port() {
		if (this.#preferBroadcast)
			return this.mbus;
		else {
			if ("DedicatedWorkerGlobalScope" in self)
				return self;
			else
				return this._port;
		}
	}

	directHandler(ev) {
		this.messageHandler(ev, 'direct');
	}

	portHandler(ev) {
		this.messageHandler(ev, 'port');
	}

	mbusHandler(ev) {
		if (ev.data?.x) {
			switch (ev.data.x) {
				case '🔔':
					console.log(`[SHWK] ${self.name} Responding to the Call!`,ev);
					this.mbus.postMessage({
						x:'🔔',
						url: self.name
					});
				  break;
				case '📡': this.#preferBroadcast = true;
				  break;
				default: this.messageHandler(ev, 'broadcast');
			}
		} else {
			this.messageHandler(ev, 'broadcast');
		}
	}

	messageHandler(ev, type) {
		console.log(`[worker] msgHandler received ${type} message`, ev.data);
		this.port.postMessage({x:'foobar', original:ev.data});
	}
}

const startWorker = (port) => {
	if (!self?.workerInstance) self.workerInstance = new sharedWorker(port);
};

self.onconnect = (e) => {
	let [port] = e.ports;

	startWorker(port);
};

("DedicatedWorkerGlobalScope" in self)?startWorker(self):null;
