export const getHeaders = (user) => ({ headers: { Authorization: `Bearer ${user.access_token}` } })

export const postHeaders = (user) => ({
  headers: {
    Authorization: `Bearer ${user.access_token}`,
    'Content-Type': 'application/json',
  },
})

export const getParams = (params, user) => ({ params, ...getHeaders(user) })
