#!/usr/bin/env sh

set -eu

npm install
npm run download
npm run rebuild
