# blog

https://yukimemi.pages.dev

This is a blog built with [Lume](https://lume.land), a static site generator for
Deno.

## Usage

### Development

Start the development server:

```bash
deno task serve
```

### Build

Build the site for production:

```bash
deno task build
```

## Structure

- `src/`: Source files for the blog.
- `_site/`: Generated static files (after build).
- `_config.ts`: Lume configuration file.
- `build.sh`: Cloudflare Pages build entrypoint.

## Deployment

Hosted on [Cloudflare Pages](https://pages.dev) at https://yukimemi.pages.dev,
built from `main` on every push.

The remote builder image has no Deno, so `build.sh` fetches a pinned,
checksum-verified Deno before running `deno task build`. The matching dashboard
settings under **Workers & Pages > yukimemi > Settings > Builds & deployments**
are:

| Setting                | Value           |
| ---------------------- | --------------- |
| Build command          | `bash build.sh` |
| Build output directory | `_site`         |

Build configuration lives in the dashboard on purpose: committing a
`wrangler.toml` with `pages_build_output_dir` would silently override those
fields, leaving two places to keep in sync.

To bump Deno, update `DENO_VERSION` **and** `DENO_SHA256` in `build.sh`. The
digest is published beside the archive; fetch it out-of-band and commit the
value, so a tampered download fails the build:

```bash
curl -sL https://dl.deno.land/release/v2.9.2/deno-x86_64-unknown-linux-gnu.zip.sha256sum
```
