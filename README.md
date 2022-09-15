# SharedDedicatedWorkerPonyfill
A ponyfill to allow usage of a web Worker (DedicatedWorkerGlobalScope) in a similar way as a SharedWorker when SharedWorker API is unavailable (looking at you Chrome on Android, even Safari is coming along) using the BroadcastChannel API

This was inspired by https://github.com/okikio/sharedworker which might be a better option if you need a quick/easy/more stable/vetted fill.

The downside of the inspired version is that, while it fills the API and mostly allows you to use is as a 'SharedWorker' without much changes, when it's filling, it's not actually shared and you end up with a worker for every context.

There was discussion in the issues there about possibly using the BroadcastChannel API to make this happen but I didn't see any progress, so I hacked away.

This is mostly untested and still needs some work but it needed a repo, so here we are.

## How it Works

See `examples`. 

First two parameters of constructor are passed directly to SharedWorker() or Worker()

To prevent automatically calling start() on an actual SharedWorker's port, you can set the third parameter of the constructor to false [default true].

If you want to test on a browser that does support SharedWorkers you can set the fourth parameter of the constructor to true [default false].

When using a SharedWorker or your code is executing in the context that birthed the DedicatedWorker, you can use the second parameter of sendMessage to do a transfer as usual, however this will throw an error if you're using DedicatedWorker/filling and not in the context that created the worker.
