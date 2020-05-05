/*
* <license header>
*/

import actions from './config.json'

/* global fetch */

/**
 *
 * Invokes a web action
 *
 * @param  {string} actionName
 * @param {object} headers
 * @param  {object} params
 *
 * @returns {Promise<string|object>} the response
 *
 */
async function actionWebInvoke (actionName, headers = {}, params = {}) {
  if (!actionName || !actions[actionName]) {
    throw new Error(`Cannot fetch action '${actionName}' as it doesn't exist.`)
  }
  const response = await fetch(actions[actionName], {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(params)
  })
  let content = await response.text()
  if (!response.ok) {
    throw new Error(`failed request to '${actions[actionName]}' with status: ${response.status} and message: ${content}`)
  }
  try {
    content = JSON.parse(content)
  } catch (e) {
    // response is not json
  }
  return content
}

export {
  actionWebInvoke
}
