import { PipelineType } from "@xenova/transformers"

declare module 'usetransformer' {
  enum TransformJobStateEnum {
    PROCESSING = 0,
    COMPLETED = 1,
    FAILED = 2,
  }

  enum TransformerMessageOperationEnum {
    INIT = 0,
    TRANSFORM = 1,
  }

  enum TransformerHookMessageTypeEnum {
    READY = 0,
    OUTPUT = 1,
  }

  interface MessageEventHandler {
    (event: MessageEvent): void
  }

  interface TransformerInitOperationArgs {
    task: PipelineType,
    model?: string
    workerCount?: number
  }

  interface TransformerTransformOperationArgs extends TransformerInitOperationArgs {
    id: string
    args: Array<any>
  }

  interface TransformerMessageEventData extends TransformerTransformOperationArgs {
    operation: TransformerMessageOperationEnum
  }

  interface TranformerMessageEvent extends MessageEvent {
    data: TransformerMessageEventData
  }

  interface TransformerInitOperation {
    (event: TransformerInitOperationArgs): Promise<void>
  }

  interface TransformerTransformOperation {
    (event: TransformerTransformOperationArgs) : Promise<void>
  }

  interface TransformerTransformInput {
    id: string | void
    args: Array<any>
  }

  interface TransformerHookMessage extends TransformerInitOperationArgs {
    type: TransformerHookMessageTypeEnum
  }

  interface TransformerHookInitMessage extends TransformerHookMessage {}

  interface TransformerHookOutputObject {
    ts: number
    result: any
    runtime: number
  }

  interface TransformerHookOutputMessage extends TransformerHookInitMessage {
    output: TransformerHookOutputObject
  }

  interface TransformJob {
    id: string
    state: TransformJobStateEnum,
    worker: Worker,
    output?: TransformerHookOutputObject,
    onOutput?: Function
  }

  interface TransformerHook {
    jobs: Map<string,TransformJob>
    ready: boolean
    loading: boolean
    working: boolean
    transform: Function
  }

  const useTransformer: (initArgs: TransformerInitOperationArgs) => TransformerHook

  export {
    useTransformer,
    MessageEventHandler,
    TransformJobStateEnum,
    TransformerMessageOperationEnum,
    TransformerHookMessageTypeEnum,
    TransformerInitOperationArgs,
    TransformerTransformOperationArgs,
    TransformerMessageEventData,
    TranformerMessageEvent,
    TransformerInitOperation,
    TransformerTransformOperation,
    TransformerTransformInput,
    TransformerHookMessage,
    TransformerHookInitMessage,
    TransformerHookOutputObject,
    TransformerHookOutputMessage,
    TransformJob,
    TransformerHook
  }
  
  export default useTransformer
}