import { pipeline, env } from '@xenova/transformers'

import {
  TranformerMessageEvent,
  TransformerMessageOperationEnum,
  TransformerInitOperation,
  TransformerTransformOperation,
  TransformerHookInitMessage,
  TransformerHookMessageTypeEnum,
  TransformerHookOutputMessage,
} from 'usetransformer'

// For now, always download *fresh* models
env.allowLocalModels = false

// A single worker should always represent a single transformer
let transformer : Function

interface TranformWorkerOperations {
  [TransformerMessageOperationEnum.INIT]: TransformerInitOperation
  [TransformerMessageOperationEnum.TRANSFORM]: TransformerTransformOperation
}

const operations : TranformWorkerOperations = {
  
  [TransformerMessageOperationEnum.INIT]: async ({ task, model }) => {
    transformer = await pipeline(task, model)
    self.postMessage({ type: TransformerHookMessageTypeEnum.READY, task, model } as TransformerHookInitMessage)
  },

  [TransformerMessageOperationEnum.TRANSFORM]: async ({ task, model, id, args }) => {
    const ts = Date.now()
    const result = await transformer?.(...args)
    const runtime = Date.now() - ts
    const output = { ts, result, runtime }
    self.postMessage({ type: TransformerHookMessageTypeEnum.OUTPUT, task, model, id, args, output } as TransformerHookOutputMessage)
  }
}

self.addEventListener('message', ({ data } : TranformerMessageEvent) => {
  if (data.operation in operations) return operations[data.operation](data)
  console.error('No such operation', data.operation)
})
