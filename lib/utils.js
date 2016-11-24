'use strict'
const path = require('path')
const inquirer = require('inquirer')
const minimist = require('minimist')
const homedir = require('homedir')
const Preferences = require('preferences')
const Git = require('simple-git')
const GitHubApi = require('github')
const CLI = require('clui')
const touch = require('touch')
const _ = require('lodash')
const fs = require('fs')
const { PREF_FILENAME } = require('./enums')
const { getCurrentDirectoryBase } = require('./../lib/files')

// const workDir = path.resolve(__dirname, '..')
const workDir = process.cwd()

const git = Git(workDir)

const github = new GitHubApi({
  version: '3.0.0'
})

const Spinner = CLI.Spinner

const _getGithubCredentials = (fn) => {
  const questions = [
    {
      name: 'username',
      type: 'input',
      message: 'Enter your Github username or e-mail address:',
      validate: (value) => {
        if (value.length) {
          return true
        } else {
          return 'Please enter your username or e-mail address'
        }
      }
    },
    {
      name: 'password',
      type: 'password',
      message: 'Enter your password:',
      validate: (value) => {
        if (value.length) {
          return true
        } else {
          return 'Please enter your password'
        }
      }
    }
  ]

  inquirer.prompt(questions).then(fn)
}

const _getGithubToken = (fn) => {
  const prefs = new Preferences(PREF_FILENAME)

  if (prefs.github && prefs.github.token) {
    console.log(`Yay! I did find a token saved in ${homedir()}/.config/preferences/${PREF_FILENAME}.pref`)
    return fn(null, prefs.github.token)
  }

  _getGithubCredentials((credentials) => {
  const status = new Spinner('Authenticating you, please wait...')
  status.start()

  github.authenticate(
    _.extend(
      {
        type: 'basic',
      },
      credentials
    )
  )

  // TODO: Doesn't work with Github two-factor authentication enabled
  github.authorization.create({
    scopes: ['user', 'public_repo', 'repo', 'repo:status'],
    note: `MVP SPACE CLI [key: _${Math.random().toString(36).substr(2, 9)}]`
  }, (err, res) => {
    status.stop()
    if (err) {
      return fn(err)
    }
    if (res.token) {
      prefs.github = {
        token : res.token
      }
      console.log(`Github credentials for [${credentials.username}] have been saved in ${homedir()}/.config/preferences/${PREF_FILENAME}.pref`)
      return fn(null, res.token)
    }
    return fn()
  })
})
}


const createRepo = (fn) => {
  const argv = minimist(process.argv.slice(2))

  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter a name for the repository:',
      default: argv._[0] || getCurrentDirectoryBase(),
      validate: (value) => {
        if (value.length) {
          return true
        } else {
          return 'Please enter a name for the repository'
        }
      }
    },
    {
      type: 'input',
      name: 'description',
      default: argv._[1] || null,
      message: 'Optionally enter a description of the repository:'
    },
    {
      type: 'list',
      name: 'visibility',
      message: 'Public or private:',
      choices: [ 'public', 'private' ],
      default: 'public'
    }
  ]

  inquirer.prompt(questions).then((answers) => {
    const status = new Spinner('Creating repository...')
    status.start()

    const data = {
      name : answers.name,
      description : answers.description,
      private : (answers.visibility === 'private')
    }

    github.repos.create(
      data,
      (err, res) => {
        status.stop()
        if (err) {
          return fn(err)
        }
        return fn(null, res.git_url)
      }
    )
  })
}

const createGitIgnore = (fn) => {
  const filelist = _.without(fs.readdirSync('.'), '.git', '.gitignore')

  if (filelist.length) {
    inquirer.prompt(
      [
        {
          type: 'checkbox',
          name: 'ignore',
          message: 'Select the files and/or folders you wish to ignore:',
          choices: filelist,
          default: ['node_modules', 'bower_components']
        }
      ]
    ).then(( answers ) => {
        if (answers.ignore.length) {
          fs.writeFileSync( '.gitignore', answers.ignore.join( '\n' ) )
        } else {
          touch( '.gitignore' )
        }
        return fn()
      }
    )
  } else {
    touch('.gitignore')
    return fn()
  }
}

const setupRepo = (url, fn) => {
  var status = new Spinner('Setting up the repository...')
  status.start()

  console.log('Working directory:', workDir)
  git
    .init(()=> console.log('Initializing repo...'))
    .add(`${workDir}/.gitignore`, ()=> console.log('Adding .gitignore ...'))
    .add(`${workDir}/*`, ()=> console.log('Adding remaining files...'))
    .commit('Initial commit', ()=> console.log('Preparing initial commit...'))
    .addRemote('origin', url, () => console.log('Adding origin...'))
    .push('origin', 'master', ()=> console.log('Pushed to master!'))
    .then(() => {
      status.stop()
      return fn()
    })
}

const githubAuth = (fn) => {
  _getGithubToken((err, token) => {
    if (err) {
      return fn(err)
    }
    github.authenticate({
      type : 'oauth',
      token : token
    })
    return fn(null, token)
  })
}

const switchToMvpGit = (fn) => {
  const questions = [
    {
      name: 'mvp-git',
      type: 'input',
      message: 'Do you want to create a new repo on your Github Account? (yes/no)',
      validate: (value) => {
      if (value === 'yes') {
       setTimeout( () => fn('yes'), 0)
       return true
      } else if (value === 'no'){
        setTimeout( () => fn('no'), 0)
        return true
        } else {
          return 'Please type either yes or no'
        }
      }
    }
  ]

  inquirer.prompt(questions)
}

module.exports = {
  githubAuth,
  setupRepo,
  createGitIgnore,
  createRepo,
  switchToMvpGit
}