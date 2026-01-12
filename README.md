# blog

https://yukimemi.deno.dev

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
