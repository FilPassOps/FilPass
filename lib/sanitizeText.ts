import xss from 'xss'

/**
 * Sanitize a string to prevent XSS attacks
 * @param {string} text - The string to be sanitized
 * @returns {string} - The sanitized string
 * @example
 * sanitizeText("<strong>hello</strong><script>alert(/xss/);</script>end")
 * returns "helloend"
 * @see https://www.npmjs.com/package/xss
 */
export const sanitizeText = (text: string) => {
  return xss(text, {
    whiteList: {}, // empty, means filter out all tags
    stripIgnoreTag: true, // filter out all HTML not in the whitelist
    stripIgnoreTagBody: ['script'], // the script tag is a special case, we need to filter out its content
  })
}
