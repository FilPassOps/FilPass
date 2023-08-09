const removeTime = (date = new Date()) => {
  return new Date(date.toDateString())
}

export const TODAY = removeTime(new Date())

export const nameRegex = new RegExp(/^'?(?:\p{L}\p{M}*)+(?:['\s](?:\p{L}\p{M}*)+)*'?$/, 'u')
