const rules = {
  '/': '/index.html',
  '/governance(/*)': 'http://example.com',
  '/cars(/:id)': '',
  '/bikes(/:id)': '/other/'
}
module.exports = { rules }
