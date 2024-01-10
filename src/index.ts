
import { v4 as uuidv4 } from 'uuid'
import { useState, useCallback, useEffect, useMemo } from 'react'

import {
  TransformerInitOperationArgs,
  TransformerHook,
  TransformJob,
  TransformerHookMessageTypeEnum,
  TransformerMessageOperationEnum,
  TransformerHookOutputObject,
  TransformJobStateEnum,
  TransformerTransformInput,
} from 'usetransformer'

const WORKER_POOL_COUNT = 1

export const useTransformer = ({ task, model, workerCount = WORKER_POOL_COUNT } : TransformerInitOperationArgs) : TransformerHook => {
  const [jobs, setJobs] = useState<Map<string,TransformJob>>(new Map())
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [workers, setWorkers] = useState<Worker[]>([])

  const messageHandler = useCallback((e : MessageEvent) => {
    if (e.data.type === TransformerHookMessageTypeEnum.READY) {
      setReady(true)
      setLoading(false)
    } else if (e.data.type === TransformerHookMessageTypeEnum.OUTPUT) {
      setJobs((prevJobs : Map<string,TransformJob>) => {
        const completedJob = prevJobs.get(e.data.id)
        const newJob = {
          ...completedJob,
          state: TransformJobStateEnum.COMPLETED,
          output: e.data.output || {} as TransformerHookOutputObject,
        } as TransformJob
        completedJob?.onOutput?.(newJob)
        return new Map(prevJobs.set(e.data.id, newJob))
      })
    }
  }, [])

  useEffect(() => {
    setReady(false)
    setLoading(true)
    setWorkers(Array(workerCount).fill(false).map(() => {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
      worker.postMessage({ operation: TransformerMessageOperationEnum.INIT, task, model })
      return worker
    }))
    return () => {
      setWorkers(workers => {
        workers.forEach(worker => worker.terminate())
        return []
      })
    }
  }, [model, task, workerCount])

  useEffect(() => {
    if (!workers.length) return
    workers.forEach((worker) => worker.addEventListener('message', messageHandler))
    return () => workers.forEach((worker) => worker.removeEventListener('message', messageHandler))
  }, [workers, messageHandler])

  const transform = useCallback(({ id: inputId, args } : TransformerTransformInput, onOutput? : Function) => {
    setJobs((prevJobs : Map<string,TransformJob>) => {
      const id = inputId || uuidv4()
      const workerIndex = prevJobs.size % workerCount
      const worker = workers.at(workerIndex) as Worker | void
      if (!worker) return prevJobs
      worker.postMessage({ operation: TransformerMessageOperationEnum.TRANSFORM, id, args })
      return new Map(prevJobs.set(id, { id, state: TransformJobStateEnum.PROCESSING, onOutput, worker }))
    })
  }, [workerCount, workers])

  const working = useMemo(() => {
    const jobsArray = Array.from(jobs.values()) as Array<TransformJob>
    const processingJob = jobsArray.find(({ state }) => state === TransformJobStateEnum.PROCESSING)
    return Boolean(processingJob)
  }, [jobs])

  return {
    jobs,
    ready,
    loading,
    working,
    transform
  }
}

export default useTransformer