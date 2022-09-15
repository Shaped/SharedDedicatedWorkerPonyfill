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

class sharedDedicatedWorker {
	constructor(port) {
		this.mbus = new BroadcastChannel(`_sharedWorkerBus:${self.name}`);
		this.mbus.addEventListener('message', this.mbusHandler.bind(this));

		if ("DedicatedWorkerGlobalScope" in self) {
			// use mbus
			this.port = this.mbus;
		} else {
			// use port; should probably default to mbus here too w/port only if needed?
			this.port = port;
			this.port.start();
		}

		this.port.addEventListener('message', this.messageHandler.bind(this));

		setTimeout(()=>{
			this.port.postMessage({
				x:'📣',
				url:self.name
			});
		},1000);
	}

	mbusHandler(ev) {
		switch (ev.data.x) {
			case '🔔':
				// a context has sent a message seeking whether a worker is already running, we must reply or a new one will be spawned in that context!
				this.mbus.postMessage({
					x:'🔔',
					url: self.name
				});
			  break;
			default:
				this.messageHandler(ev);
		}
	}

	messageHandler(ev) {
		console.log(`your Message Handler goes Here`)
		console.log(ev.data);
		this.port.postMessage('bar');
	}
}

const startWorker = (port) => {
	if (!self?.workerInstance) self.workerInstance = new sharedDedicatedWorker(port);
};

self.onconnect = (e) => {
	let [port] = e.ports;

	startWorker(port);
};

("DedicatedWorkerGlobalScope" in self)?startWorker(self):null;
