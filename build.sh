#!/usr/bin/env bash
# =============================================================================
# File        : build.sh
# Author      : yukimemi
# Description : Cloudflare Pages build entrypoint.
# =============================================================================
#
# The Cloudflare Pages remote builder image ships Node.js but not Deno, so a
# pinned Deno is fetched here before handing off to Lume. The official
# `deno.land/install.sh` is deliberately *not* used: it branches on whether
# stdout is a TTY and can fetch an extra shell-setup package, neither of which
# is wanted in CI. Unpacking the release archive directly keeps the build
# reproducible and side-effect free.
#
# Dashboard settings this script pairs with
# (Workers & Pages > yukimemi > Settings > Builds & deployments):
#
#   Build command          : bash build.sh
#   Build output directory : _site
#
set -euo pipefail

# Bumping Deno means updating BOTH of these. The expected digest is published
# next to the archive as `<archive>.sha256sum`, but deliberately is not fetched
# at build time: a host able to swap the archive could swap the digest beside
# it just as easily. Pinning the value here is what actually makes the download
# tamper-evident, so verify it out-of-band once and commit it:
#
#   curl -sL "https://dl.deno.land/release/$DENO_VERSION/deno-$DENO_TARGET.zip.sha256sum"
#
DENO_VERSION="v2.9.2"
DENO_TARGET="x86_64-unknown-linux-gnu"
DENO_SHA256="934d1bd5cb09eaed7f2e4a4fc58208d04a3c5c0fcde9f319d93d735265c67a4a"
DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"
export PATH="$DENO_INSTALL/bin:$PATH"

if ! command -v deno >/dev/null 2>&1; then
  echo "==> Installing Deno $DENO_VERSION ($DENO_TARGET)"
  archive="$DENO_INSTALL/bin/deno.zip"
  mkdir -p "$DENO_INSTALL/bin"
  curl --fail --location --silent --show-error \
    --output "$archive" \
    "https://dl.deno.land/release/${DENO_VERSION}/deno-${DENO_TARGET}.zip"

  # Compared as a plain string rather than via `sha256sum --check`, whose
  # checkfile format escapes any path containing a backslash and would need
  # the expected line escaped to match.
  actual="$(sha256sum "$archive" | cut -d ' ' -f 1)"
  if [ "$actual" != "$DENO_SHA256" ]; then
    echo "Error: checksum mismatch for the Deno $DENO_VERSION archive." >&2
    echo "  expected: $DENO_SHA256" >&2
    echo "  actual:   $actual" >&2
    rm -f "$archive"
    exit 1
  fi

  unzip -oq "$archive" -d "$DENO_INSTALL/bin"
  rm -f "$archive"
  chmod +x "$DENO_INSTALL/bin/deno"
fi

echo "==> $(deno --version | head -n 1)"

echo "==> Building the site into _site/"
deno task build
