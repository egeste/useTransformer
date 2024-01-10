import { v4 as uuidv4 } from 'uuid';
import { useState, useCallback, useEffect, useMemo } from 'react';
const WORKER_POOL_COUNT = 1;
export const useTransformer = ({ task, model, workerCount = WORKER_POOL_COUNT }) => {
    const [jobs, setJobs] = useState(new Map());
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [workers, setWorkers] = useState([]);
    const messageHandler = useCallback((e) => {
        if (e.data.type === TransformerHookMessageType.READY) {
            setReady(true);
            setLoading(false);
        }
        else if (e.data.type === TransformerHookMessageType.OUTPUT) {
            setJobs((prevJobs) => {
                var _a;
                const completedJob = prevJobs.get(e.data.id);
                const newJob = Object.assign(Object.assign({}, completedJob), { state: TransformJobState.COMPLETED, output: e.data.output || {} });
                (_a = completedJob === null || completedJob === void 0 ? void 0 : completedJob.onOutput) === null || _a === void 0 ? void 0 : _a.call(completedJob, newJob);
                return new Map(prevJobs.set(e.data.id, newJob));
            });
        }
    }, []);
    useEffect(() => {
        setReady(false);
        setLoading(true);
        setWorkers(Array(workerCount).fill(false).map(() => {
            const worker = new Worker(new URL('../util/transformer.worker.ts', import.meta.url), { type: 'module' });
            worker.postMessage({ operation: TransformerMessageOperation.INIT, task, model });
            return worker;
        }));
        return () => {
            setWorkers(workers => {
                workers.forEach(worker => worker.terminate());
                return [];
            });
        };
    }, [model, task, workerCount]);
    useEffect(() => {
        if (!workers.length)
            return;
        workers.forEach((worker) => worker.addEventListener('message', messageHandler));
        return () => workers.forEach((worker) => worker.removeEventListener('message', messageHandler));
    }, [workers, messageHandler]);
    const transform = useCallback(({ id: inputId, args }, onOutput) => {
        setJobs((prevJobs) => {
            const id = inputId || uuidv4();
            const workerIndex = prevJobs.size % workerCount;
            const worker = workers.at(workerIndex);
            if (!worker)
                return prevJobs;
            worker.postMessage({ operation: TransformerMessageOperation.TRANSFORM, id, args });
            return new Map(prevJobs.set(id, { id, state: TransformJobState.PROCESSING, onOutput, worker }));
        });
    }, [workerCount, workers]);
    const working = useMemo(() => {
        const jobsArray = Array.from(jobs.values());
        const processingJob = jobsArray.find(({ state }) => state === TransformJobState.PROCESSING);
        return Boolean(processingJob);
    }, [jobs]);
    return {
        jobs,
        ready,
        loading,
        working,
        transform
    };
};
export default useTransformer;
