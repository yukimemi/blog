#!/usr/bin/env bash
# =============================================================================
# File        : build.sh
# Author      : yukimemi
# Description : Cloudflare Pages build entrypoint (Zola + postprocess + Pagefind).
# =============================================================================
#
# The pipeline, in strict order:
#
#   1. zola build         -- renders content/ + templates/ into public/
#   2. blog-postprocess   -- rewrites public/**/*.html in place: link cards,
#                            GitHub snippet embeds, code-block gutters
#   3. pagefind --site    -- indexes the *final* HTML and writes the search
#                            bundle to public/pagefind/
#
# The ordering is load-bearing, not cosmetic:
#
#   * blog-postprocess edits Zola's output rather than participating in
#     rendering, so it cannot run before step 1.
#   * Pagefind reads HTML off disk and derives both the word index and the
#     result excerpts from it. It therefore has to run dead last. Run before
#     step 2 it would index the unexpanded placeholders, so every card and
#     embed the post-processor produces would be invisible to search, and the
#     excerpts it did return would quote text no longer on the page.
#
# Zola wipes the output directory at the start of every build, so both the
# post-processor's edits and the Pagefind bundle from a previous run are gone
# before they are re-created. That is what keeps repeated invocations
# idempotent, and it also stops Pagefind from ever indexing its own output.
#
# Because step 1 destroys the tree that steps 2 and 3 repair, `zola build`
# should not be run on its own while anyone is inspecting public/: run this
# script, which always carries the tree back to a complete state.
#
# Dashboard settings this script pairs with
# (Workers & Pages > yukimemi > Settings > Builds & deployments):
#
#   Build command          : bash build.sh
#   Build output directory : public
#
# Measured build cost, so the next person weighing a move to GitHub Actions
# does not have to re-measure. Cold, on a Rust-less x86_64 Linux image:
#
#   zola fetch + extract      1s
#   rustup-init download      2s
#   rust toolchain install   39s   (--profile minimal)
#   cargo build --release    26s   (cold target/)
#   npx fetching pagefind    40s   (first time on the machine)
#   zola build + postprocess
#     + pagefind indexing      ~7s
#   ------------------------------
#   ~2m20s total
#
# Provisioning the Rust toolchain is ~67s of that, against Cloudflare Pages'
# 20-minute ceiling, so it is not a reason to move the build. Toolchain
# footprint is the thing to watch: ~886MB on disk (.rustup 593M, .cargo 90M,
# tools/postprocess/target 203M).
#
# Warm, on a developer machine with everything cached: 16-26s wall. Only ~7s
# of that is real work; the rest is `npx --yes` re-resolving the pagefind
# package against the registry (5-7s even when cached) plus Windows filesystem
# overhead. Installing pagefind onto PATH skips the npx branch entirely.
#
# Environment knobs:
#
#   POSTPROCESS_OFFLINE=1   pass --offline to blog-postprocess, expanding only
#                           what is already in the cache instead of reaching
#                           the network. For CI with restricted egress.
#
set -euo pipefail

cd "$(dirname "$0")"

OUTPUT_DIR="public"
POSTPROCESS_CACHE=".postprocess-cache.json"
POSTPROCESS_MANIFEST="tools/postprocess/Cargo.toml"

# The remote builder image ships Node.js and nothing else this build needs, so
# both Zola and the Rust toolchain are provisioned here. Both are resolved up
# front, before any rendering happens, so a provisioning failure costs a few
# seconds rather than surfacing after a full site build.

# -----------------------------------------------------------------------------
# Zola
# -----------------------------------------------------------------------------
# Only the `zola` member is extracted from the release archive; it also carries
# man pages and licences that the build has no use for.
#
# Bumping Zola means updating BOTH the version and the digest below. Zola does
# not publish a checksum file next to its release assets, and fetching one at
# build time would be pointless anyway: a host able to swap the archive could
# swap the digest beside it just as easily. Pinning the value here is what
# actually makes the download tamper-evident, so verify it out-of-band once and
# commit it:
#
#   curl -sL "https://github.com/getzola/zola/releases/download/$ZOLA_VERSION/zola-$ZOLA_VERSION-$ZOLA_TARGET.tar.gz" | sha256sum
#
ZOLA_VERSION="v0.23.3"
ZOLA_TARGET="x86_64-unknown-linux-gnu"
ZOLA_SHA256="f07c92607e5745268b576bd325ceef3a582aada253bb64db8d92a8a85303d958"
ZOLA_INSTALL="${ZOLA_INSTALL:-${HOME:-.}/.zola}"
export PATH="$ZOLA_INSTALL/bin:$PATH"

# Resolved once into $ZOLA so the rest of the script never has to care which of
# the three sources won.
ZOLA=""

if command -v zola >/dev/null 2>&1; then
  # Already installed: a previous run of this script, a CI cache, or a
  # developer's own install.
  ZOLA="zola"
elif [ -n "${USERPROFILE:-}" ] && [ -x "${USERPROFILE//\\//}/.local/bin/zola.exe" ]; then
  # Windows developer checkout. `zola.exe` frequently lives in a per-user bin
  # directory that Git Bash does not put on PATH, so look there before
  # reaching for a Linux archive that would not run here anyway.
  ZOLA="${USERPROFILE//\\//}/.local/bin/zola.exe"
else
  echo "==> Installing Zola $ZOLA_VERSION ($ZOLA_TARGET)"
  archive="$ZOLA_INSTALL/zola.tar.gz"
  mkdir -p "$ZOLA_INSTALL/bin"
  curl --fail --location --silent --show-error \
    --output "$archive" \
    "https://github.com/getzola/zola/releases/download/${ZOLA_VERSION}/zola-${ZOLA_VERSION}-${ZOLA_TARGET}.tar.gz"

  # Compared as a plain string rather than via `sha256sum --check`, whose
  # checkfile format escapes any path containing a backslash and would need
  # the expected line escaped to match.
  actual="$(sha256sum "$archive" | cut -d ' ' -f 1)"
  if [ "$actual" != "$ZOLA_SHA256" ]; then
    echo "Error: checksum mismatch for the Zola $ZOLA_VERSION archive." >&2
    echo "  expected: $ZOLA_SHA256" >&2
    echo "  actual:   $actual" >&2
    rm -f "$archive"
    exit 1
  fi

  tar -xzf "$archive" -C "$ZOLA_INSTALL/bin" zola
  rm -f "$archive"
  chmod +x "$ZOLA_INSTALL/bin/zola"
  ZOLA="zola"
fi

echo "==> $("$ZOLA" --version)"

# -----------------------------------------------------------------------------
# Rust toolchain
# -----------------------------------------------------------------------------
# blog-postprocess is a Rust crate in this repo and there is no prebuilt binary
# to download, so a toolchain has to exist before step 2 can run.
#
# `sh.rustup.rs` is deliberately not piped into a shell: it resolves whatever
# rustup happens to be current, which makes the build non-reproducible, and
# there is nothing to verify a piped script against. The pinned `rustup-init`
# under /rustup/archive/ is a stable URL with a published digest, so it can be
# fetched and checked like any other artifact. Verify a new pin against
#
#   curl -sL "https://static.rust-lang.org/rustup/archive/$RUSTUP_VERSION/$RUST_TARGET/rustup-init.sha256"
#
# once, out-of-band, then commit the value here.
RUSTUP_VERSION="1.29.0"
RUST_VERSION="1.97.0"
RUST_TARGET="x86_64-unknown-linux-gnu"
RUSTUP_INIT_SHA256="4acc9acc76d5079515b46346a485974457b5a79893cfb01112423c89aeb5aa10"
export RUSTUP_HOME="${RUSTUP_HOME:-${HOME:-.}/.rustup}"
export CARGO_HOME="${CARGO_HOME:-${HOME:-.}/.cargo}"
export PATH="$CARGO_HOME/bin:$PATH"

if ! command -v cargo >/dev/null 2>&1; then
  echo "==> Installing Rust $RUST_VERSION via rustup $RUSTUP_VERSION ($RUST_TARGET)"
  init="$CARGO_HOME/rustup-init"
  mkdir -p "$CARGO_HOME"
  curl --fail --location --silent --show-error \
    --output "$init" \
    "https://static.rust-lang.org/rustup/archive/${RUSTUP_VERSION}/${RUST_TARGET}/rustup-init"

  actual="$(sha256sum "$init" | cut -d ' ' -f 1)"
  if [ "$actual" != "$RUSTUP_INIT_SHA256" ]; then
    echo "Error: checksum mismatch for rustup-init $RUSTUP_VERSION." >&2
    echo "  expected: $RUSTUP_INIT_SHA256" >&2
    echo "  actual:   $actual" >&2
    rm -f "$init"
    exit 1
  fi

  chmod +x "$init"
  # --profile minimal drops rust-docs, clippy and rustfmt: ~200MB of download
  # the build never touches. --no-modify-path keeps the installer from writing
  # to shell rc files in an image that is thrown away anyway; PATH is already
  # set above.
  "$init" -y --profile minimal --no-modify-path --default-toolchain "$RUST_VERSION"
  rm -f "$init"
fi

echo "==> $(cargo --version)"

# -----------------------------------------------------------------------------
# 1. Render
# -----------------------------------------------------------------------------
echo "==> Building the site into $OUTPUT_DIR/"
"$ZOLA" build

# -----------------------------------------------------------------------------
# 2. Post-process
# -----------------------------------------------------------------------------
# Expands the remote-content placeholders Zola's template layer cannot produce.
# Built rather than downloaded, so the compile is part of the build cost; see
# the toolchain note above.
echo "==> Building blog-postprocess"
cargo build --release --manifest-path "$POSTPROCESS_MANIFEST"

# Cargo appends .exe on Windows. Both names are probed rather than branching on
# $OSTYPE, which Git Bash and MSYS report differently.
POSTPROCESS=""
for candidate in \
  "tools/postprocess/target/release/blog-postprocess" \
  "tools/postprocess/target/release/blog-postprocess.exe"
do
  if [ -x "$candidate" ]; then
    POSTPROCESS="$candidate"
    break
  fi
done

if [ -z "$POSTPROCESS" ]; then
  echo "Error: cargo reported success but no blog-postprocess binary was found." >&2
  echo "  looked in tools/postprocess/target/release/" >&2
  exit 1
fi

postprocess_args=(--root "$OUTPUT_DIR" --cache "$POSTPROCESS_CACHE")
if [ "${POSTPROCESS_OFFLINE:-0}" != "0" ]; then
  # Cached entries still expand; anything uncached degrades to a plain
  # paragraph instead of failing the build.
  echo "==> POSTPROCESS_OFFLINE set: running without network access"
  postprocess_args+=(--offline)
fi

echo "==> Post-processing $OUTPUT_DIR/"
"$POSTPROCESS" "${postprocess_args[@]}"

# -----------------------------------------------------------------------------
# 3. Index
# -----------------------------------------------------------------------------
# Zola has no search of its own, so /search/ is served entirely by Pagefind:
# this step writes public/pagefind/, which holds both the index shards and the
# pagefind-ui.{js,css} assets that templates/search.html loads.
#
# Pinned to the same version the previous Lume build used, and run through the
# npm package because the builder image already has Node. The npm package
# installs the *extended* binary, which is the one carrying the Japanese and
# Chinese word segmenters -- required here, since the site is `<html lang="ja">`
# and would otherwise index Japanese prose as a handful of giant unsearchable
# "words".
PAGEFIND_VERSION="1.4.0"

# No --exclude-selectors here on purpose. The code-block chrome that must stay
# out of the index -- the language label and the line-number gutter -- is
# marked with `data-pagefind-ignore` by blog-postprocess itself, so the rule
# travels with the markup that creates it instead of living in a selector list
# in this file that would silently rot the next time those class names change.
echo "==> Indexing $OUTPUT_DIR/ with Pagefind $PAGEFIND_VERSION"
if command -v pagefind >/dev/null 2>&1; then
  pagefind --site "$OUTPUT_DIR"
else
  npx --yes "pagefind@${PAGEFIND_VERSION}" --site "$OUTPUT_DIR"
fi

echo "==> Build complete: $OUTPUT_DIR/"
