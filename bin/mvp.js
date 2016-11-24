#!/usr/bin/env node

require('commander')
  .usage('<command> <starter-kit> [options]')
  .command('init', 'generate a new Meteor project from starter-kits')
  .command('git', 'initiate a new repo on your own github')
  .parse(process.argv)