# useTransformer

## General gist

```ts
// Import the hook
import useTransformer from 'usetransformer'

// Create your transformer worker(s)
const transcriber = useTransformer({
  task: 'automatic-speech-recognition',
  model: `distil-whisper/distil-small.en`,
  workerCount: 2
} as TransformerInitOperationArgs)

// Transform your data
transcriber.transform({ args: [audioBuffer] }, ({ output } : TransformerHookOutputMessage) => {
  console.log(output.result.text.trim())
})
```
