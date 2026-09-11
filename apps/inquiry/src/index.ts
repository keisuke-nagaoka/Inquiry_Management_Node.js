import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.port, () => {
  console.log(`inquiry-api listening on :${env.port} (env=${env.nodeEnv})`);
});
