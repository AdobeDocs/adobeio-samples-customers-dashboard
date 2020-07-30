/*
 * Copyright 2020 Adobe Inc. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// react imports
import React from 'react'
import PropTypes from 'prop-types'
import ErrorBoundary from 'react-error-boundary'

// react spectrum components
// react spectrum components
import { Provider, defaultTheme, ActionButton, AlertDialog, DialogTrigger,
  Flex, Grid, ProgressCircle, Heading, Text } from '@adobe/react-spectrum'

// local imports
import './App.css'
import { actionWebInvoke } from './utils'

/* Here is your entry point React Component, this class has access to the Adobe Experience Cloud Shell runtime object */

export default class App extends React.Component {
  constructor (props) {
    super(props)

    // error handler on UI rendering failure
    this.onError = (e, componentStack) => {}

    // component to show if UI fails rendering
    this.fallbackComponent = ({ componentStack, error }) => (
      <React.Fragment>
        <h1 style={{ textAlign: 'center', marginTop: '20px' }}>Something went wrong :(</h1>
        <pre>{ componentStack + '\n' + error.message }</pre>
      </React.Fragment>
    )

    this.state = {
      actionSelected: null,
      actionResponseError: null,
      actionHeaders: null,
      actionHeadersValid: null,
      actionParams: null,
      actionParamsValid: null,
      actionInvokeInProgress: false,
      profiles: null
    }

    this.sendPromo = this.sendPromo.bind(this)

    console.log('runtime object:', this.props.runtime)
    console.log('ims object:', this.props.ims)
  }

  // load customer profiles at page ready
  async componentWillMount () {
    this.setState({ actionInvokeInProgress: true })
    
    const headers = {}
    const params = {}

    // set the authorization header and org from the ims props object
    if (this.props.ims.token && !headers.authorization) {
      headers.authorization = 'Bearer ' + this.props.ims.token
    }
    if (this.props.ims.org && !headers['x-gw-ims-org-id']) {
      headers['x-gw-ims-org-id'] = this.props.ims.org
    }
    try {
      const actionResponse = await actionWebInvoke('get-profiles', headers, params)
      this.setState({ profiles: actionResponse.body.content, actionResponseError: null, actionInvokeInProgress: false })
      console.log(`action response:`, actionResponse)
    } catch (e) {
      console.error(e)
      this.setState({ profiles: null, actionResponseError: e.message, actionInvokeInProgress: false })
    }
  }

  static get propTypes () {
    return {
      runtime: PropTypes.any,
      ims: PropTypes.any
    }
  }

  // invoke send-promo action by user email
  async sendPromo (email) {
    try {
      const headers = {}

      // set the authorization header and org from the ims props object
      if (this.props.ims.token && !headers.authorization) {
        headers.authorization = 'Bearer ' + this.props.ims.token
      }
      if (this.props.ims.org && !headers['x-gw-ims-org-id']) {
        headers['x-gw-ims-org-id'] = this.props.ims.org
      }
      const actionResponse = await actionWebInvoke('send-promo', headers, { email })
      console.log(`Response from send-promo:`, actionResponse)
    } catch (e) {
      // log and store any error message
      console.error(e)
    }
  }

  render () {
    const profiles = this.state.profiles
    console.log(`profiles object:`, profiles)
    return (
      // ErrorBoundary wraps child components to handle eventual rendering errors
      <ErrorBoundary onError={ this.onError } FallbackComponent={ this.fallbackComponent } >
      <Provider UNSAFE_className='provider' theme={ defaultTheme }>
        <Flex UNSAFE_className='main'>
          <Heading UNSAFE_className='main-title'>Welcome to customers-dashboard!</Heading>
          <Flex UNSAFE_className='profiles'>
            <ProgressCircle
              UNSAFE_className='actions-invoke-progress'
              aria-label='loading'
              isIndeterminate
              isHidden={ !this.state.actionInvokeInProgress }/>
            { !!profiles &&
              <Grid>
                {profiles.map((profile, i) => {
                  return <Flex UNSAFE_className='profile'>
                    <DialogTrigger>
                      <ActionButton
                        UNSAFE_className='actions-invoke-button'>
                        Send promo code
                      </ActionButton>
                      <AlertDialog
                        variant='confirmation'
                        title='Send promo code'
                        primaryActionLabel='Confirm'
                        cancelLabel='Cancel'
                        onPrimaryAction={ () => this.sendPromo(profile['email']) }>
                        Do you want to send promo to { profile['email'] }?
                      </AlertDialog>
                    </DialogTrigger>
                    Name: { profile['firstName'] } { profile['lastName'] } - Email: { profile['email'] } - Date of birth: { profile['birthDate'] }
                  </Flex>
                })}
              </Grid>
            }
            { !profiles &&
              <Text>No profiles!</Text>
            }

          </Flex>
        </Flex>
      </Provider>
      </ErrorBoundary>
    )
  }
}
