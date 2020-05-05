/*
* <license header>
*/

import "core-js/stable"
import "regenerator-runtime/runtime"

import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'
import loadExcRuntime from './exc-runtime'

/* Here you can bootstrap your application and configure the integration with the Adobe Experience Cloud Shell */
let inExc = false
try {
  // throws if not running in exc
  loadExcRuntime(document, window)
  inExc = true
} catch (e) {
  console.log('application not running in Adobe Experience Cloud Shell')
  // fallback, not in exc run the UI without the shell
  bootstrapRaw()
}

if (inExc) {
  // this piece of code is needed in case the Adobe Experience Cloud shell runtime is not yet loaded.
  // if it is ready we bootstrap the app, otherwise we defer the bootstrapping to the exc runtime when it is ready.
  if ('exc-module-runtime' in window) {
    bootstrapInExcShell()
  } else {
    // callback for the exc shell runtime, if not ready yet
    window.EXC_MR_READY = () => bootstrapInExcShell()
  }
}

function bootstrapRaw () {
  /* **here you can mock the exc runtime and ims objects** */
  const runtime = {}
  const ims = {}

  // render the actual react application and pass along the runtime object to make it available to the App
  ReactDOM.render(<App runtime={ runtime } ims={ ims }/>, document.getElementById('root'))
}

function bootstrapInExcShell () {
  // initializes the runtime object
  const Runtime = window['exc-module-runtime'].default
  const runtime = new Runtime({
    // this options allows the app to takeover 100% of the browser's viewport
    canTakeover: true
  })

  // set the app name to the Shell header
  runtime.customEnvLabel = 'customers-dashboard'

  // use this to set a favicon
  // runtime.favicon = 'url-to-favicon'

  // use this to respond to clicks on the app-bar title
  // runtime.heroClick = () => window.alert('Did I ever tell you you\'re my hero?')

  // ready event brings in authentication/user info
  runtime.on('ready', ({ imsOrg, imsToken, imsProfile, locale }) => {
    console.log('Ready! received imsProfile:', imsProfile)
    const ims = {
      profile: imsProfile,
      org: imsOrg,
      token: imsToken
    }
    // render the actual react application and pass along the runtime and ims objects to make it available to the App
    ReactDOM.render(<App runtime={ runtime } ims={ ims }/>, document.getElementById('root'))
  })

  // respond to history change events
  runtime.historyChange = path => {
    console.log('history changed :: ', path)
    // this.history.replace(path)
    // this.setState({currentPath: `/${path}`})
  }

  // set solution info, shortTitle is used when window is too small to display full title
  runtime.solution = {
    icon: 'AdobeExperienceCloud',
    title: 'customers-dashboard',
    shortTitle: 'JGR'
  }
  runtime.title = 'customers-dashboard'

  // tell the exc-runtime object we are done
  runtime.done()
}
