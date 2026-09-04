# Vercel deployment diagnosis

## Confirmed

- Repository: https://github.com/Hacker254Mwalo/digishop1
- Vercel project: `digishop1`, project ID `prj_dBWA6FO9f0uedNevNrvb5DqoKhCQ`
- Production domain: https://digishop1.vercel.app/
- GitHub `main` contains commit `fc075939f4fbb9054a3b03fbc14aee584d9cb30a` (`Use Vercel default function runtime`).
- The latest Vercel deployment for that commit reached `READY`: `dpl_G8cuJ7fBLq59M9gznuTiR5RaKStZ`, URL `digishop1-33cn5rws2-hacker254mwalos-projects.vercel.app`.
- The live homepage now renders the Digital Phone Hub application and no longer exposes raw source files: https://digishop1.vercel.app/

## Remaining issue

- The live tRPC endpoint test at https://digishop1.vercel.app/api/trpc/auth.me returns Vercel `404: NOT_FOUND`.
- The likely remaining deployment issue is that the Vercel project is serving the Vite static output but is not registering the `api/[...path].ts` function route. The local `pnpm check`, `pnpm test` (9 tests) and `pnpm build` pass.
- The original raw-source issue was caused by the project having no Vercel output mapping; the repository now contains `vercel.json` with framework `vite`, build command `pnpm run build`, install command `pnpm install --frozen-lockfile`, and output directory `dist/public`.

## Next target

Verify Vercel’s API function routing behavior for the catch-all file and adjust the function entrypoint/configuration so `/api/trpc/*` is served without disturbing the now-correct static homepage.
