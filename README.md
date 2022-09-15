# SharedDedicatedWorkerPonyfill
A ponyfill to allow usage of a web Worker (DedicatedWorkerGlobalScope) in a similar way as a SharedWorker when SharedWorker API is unavailable (looking at you Chrome on Android, even Safari is coming along) using the BroadcastChannel API
