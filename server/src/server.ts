import mongoose from 'mongoose'
import { app } from './app.js'
import { env } from './config/env.js'

async function start() {
  await mongoose.connect(env.MONGO_URI)
  app.listen(env.PORT, () => console.info(`KITTY API listening on port ${env.PORT}`))
}

start().catch((error: unknown) => {
  console.error('Unable to start KITTY API', error)
  process.exitCode = 1
})
