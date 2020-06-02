import { usersStorage } from './init'

export const getUser = (username: String): Promise<Object> =>
  usersStorage.getItem(username).catch(() => console.log('erreur lors de getUser'))

export const setUser = (user: Object): Promise<void> => usersStorage.setItem(user.name, user)

export const getUsernames = (): Promise<Array<String>> => usersStorage.keys()
