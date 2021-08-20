const rules = {
  '/': '/index.html',
  '/governance(/*)': 'http://google.com',
  '/cars(/:id)': '',
  '/bikes(/:id)': '/other/'
}
module.exports = { rules }
