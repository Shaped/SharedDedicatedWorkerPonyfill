// JS file for your main pages

class myApp {
	constructor() {
		// some of your app stuff can go here

		return (async()=>{
			let { SharedDedicatedWorkerPonyfill : SharedDedicatedWorker } = await import(`../src/SharedDedicatedWorkerPonyfill.js`);
			this.myWorker = await new SharedDedicatedWorker(`./sharedDedicatedWorker.js`);
		})();
	}

	doSomeStuff() {
		// post a message to the worker
		this.myWorker.postMessage({
			message: 'messageForYourWorker'
		});
	}
}

(async()=>{
	window.myApp = await new myApp();
	window.addEventListener(`DOMContentLoaded`, _=>myApp.initialize() );
})();
