import createApp from "../server/_core/api";

let appPromise;

export default async function handler(req, res) {
  appPromise ??= createApp();
  const app = await appPromise;
  return app.handle(req, res);
}
