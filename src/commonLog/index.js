import { getGistParams } from '../commonBDD'

const Octokit = require('@octokit/rest')

let gistParams
let clientWithAuth

export const initGist = () =>
  getGistParams().then((result) => {
    gistParams = result
    clientWithAuth = new Octokit({
      auth: gistParams.token,
    })
  })

export const updateExclusionGist = (excludes) => {
  const files = {}
  Object.keys(excludes).forEach((key) => {
    files[`${key}.txt`] = {
      content: excludes[key].sort((a, b) => a.localeCompare(b)).join('\n'),
    }
  })

  clientWithAuth.gists
    .update({
      gist_id: gistParams.exclusionId,
      files,
    })
    .catch((e) => console.log('Pixelle::index.js::28::e =>', e))
}

export const updateOrderGist = (order) => {
  const files = {}
  Object.keys(order).forEach((key) => {
    files[`${key}.txt`] = {
      content: order[key],
    }
  })

  clientWithAuth.gists
    .update({
      gist_id: gistParams.orderId,
      files,
    })
    .catch((e) => console.log('Pixelle::index.js::45::e =>', e))
}
