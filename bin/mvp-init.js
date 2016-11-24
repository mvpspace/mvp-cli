#!/usr/bin/env node
'use strict'
const download = require('download-git-repo')
const clear = require('clear')
const figlet = require('figlet')
const program = require('commander')
const os = require('os')
const path = require('path')
const rm = require('rimraf').sync
const uid = require('uid')
const CLI = require('clui')
const chalk = require('chalk')
const inquirer = require('inquirer')
const copyDir = require('copy-dir')
const { GITHUB_TEMPLATE_REPO } = require('./../lib/enums')
const { switchToMvpGit } = require('./../lib/utils')

const Spinner = CLI.Spinner

program
  .usage('<starter-kit> <local-repo-name>')

/**
 * Help.
 */

program.on('--help', () => {
  console.log('  Examples:')
  console.log()
  console.log(chalk.gray('    # create a new Meteor project with the basic-starter-kit'))
  console.log('    $ mvp init basic local-repo-name')
  console.log()
  console.log(chalk.gray('    # create a new Meteor project with the redux-starter-kit'))
  console.log('    $ mvp init redux local-repo-name')
  console.log()
  console.log(chalk.gray('    # create a new Meteor project with the apollo-starter-kit'))
  console.log('    $ mvp init apollo local-repo-name')
  console.log()
})

/**
 * Help.
 */

const help = () => {
  program.parse(process.argv)
  if (program.args.length < 1) return program.help()
}
help()

/**
 * Padding.
 */

console.log()
process.on('exit', () => {
  console.log()
})

/**
 * Settings.
 */

const template = program.args[0]
const simpleTemplateName = template
const rawName = program.args[1]
const inPlace = !rawName || rawName === '.'
const name = inPlace ? path.relative('../', process.cwd()) : rawName

/**
 * Check, download and generate the project.
 */

/**
 * Download a generate from a template repo.
 *
 * @param {String} template
 */

const downloadAndGenerate = (template) => {
  clear()
  console.log(
    chalk.yellow(
      figlet.textSync('MVP-SPACE CLI', { horizontalLayout: 'full' })
    )
  )
  console.log(chalk.yellow('INIT STARTER KIT'))
  const tmp = os.tmpdir() + '/mvp-starter-kit' + uid()
  const spinner = new Spinner('downloading...')
  spinner.start()
  download(template, tmp, { clone: false }, (err) => {
    spinner.stop()
    process.on('exit', () => {
      rm(tmp)
    })
    if (err) {
      console.log('Failed to download repo ' + template + ': ' + err.message.trim())
    } else {
      copyDir(tmp, './', (err) => {
        if (err) {
          console.error('There was an error while coping files in this directory', err)
        } else {
          console.log("Success! All files were copied")
          switchToMvpGit((answer) => {
              if (answer === 'yes') {
                // const cmd = `mvp git ${name} "${simpleTemplateName}-starter-kit"`
                const cmd = `mvp git`
                console.log(chalk.yellow('Great!'))
                // console.log(chalk.green(`mvp git ${name} "${simpleTemplateName}-starter-kit"`))

                //mvpGit({name, simpleTemplateName})
                const spawn = require('child_process').spawn

                var args = ['git', name, simpleTemplateName]

                var options = {
                  stdio: 'inherit' //feed all child process logging into parent process
                }

                const childMvpGitProcess = spawn('mvp', args, options)
                childMvpGitProcess.on('close', (code)  => {
                  let message
                  if (code === 0) {
                    message = 'Both mvp init and git were successfully completed \n'
                  } else {
                    'There was an error: mvp git completed with code ' + code + '\n'
                  }
                  process.stdout.write(message)
                })

              } else if (answer === 'no') {
                console.log(chalk.yellow(`Later you may init this new repo anyway on your own gitHub with 'mvp git repo-name "description"' `))
              }
          })
        }

    })
      console.log()
      console.log('Generated "%s".', name)
    }
  })
}

const officialTemplate = `${GITHUB_TEMPLATE_REPO}/${template}-starter-kit`
downloadAndGenerate(officialTemplate)