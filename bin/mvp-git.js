'use strict'
const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')
const Preferences = require('preferences')
const { directoryExists } = require('./../lib/files')
const {
  createRepo,
  createGitIgnore,
  setupRepo,
  githubAuth
} = require('./../lib/utils')
const { PREF_FILENAME } = require('./../lib/enums')

clear()
console.log(
  chalk.yellow(
    figlet.textSync('MVP-SPACE CLI', { horizontalLayout: 'full' })
  )
)
console.log(chalk.yellow('CREATE GITHUB REPO'))

if (directoryExists('.git')) {
  console.log(chalk.red('Already a git repository!'))
  process.exit()
}

// if everything is ok create a repo
githubAuth((err, authed) => {
  if (err) {
    switch (err.code) {
      case 401:
        console.log(chalk.red('Couldn\'t log you in. Please try again.'))
        break
      case 422:
        console.log(chalk.red('You already have an access token.'))
        break
    }
  }
  if (authed) {
    console.log(chalk.green('Sucessfully authenticated!'))
    createRepo((err, url) => {
      if (err) {
        const prefs = new Preferences(PREF_FILENAME)
        prefs.github = {
          token : undefined
        }
        console.log('An error has occured', err.message, 'TRY AGAIN :)')
      }
      if (url) {
        createGitIgnore(() => {
          const tokenUrl = `https://${authed}:@${url.substring(6)}`
          setupRepo(tokenUrl, (err) => {
            if (!err) {
              console.log(chalk.green('All done!'))
            }
          })
        })
      }
    })
  }
})
