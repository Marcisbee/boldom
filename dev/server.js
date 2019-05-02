const fs = require('fs')
const http = require('http')

const port = 3001

module.exports = function (source) {
  const server = http.createServer((...props) => {
    const [req, res] = props;
    const { url } = req;

    const filePath = url === '/boldom.js' ? source : `.${url === '/' ? '/index.html' : url}`;

    let data;
    try {
      data = fs.readFileSync(filePath, 'utf8')
    } catch (e) { }

    if (!data) {
      res.writeHead(404)
    } else {
      res.writeHead(200)
    }

    if (/\.js$/.test(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/javascript' })
    }

    if (/\.html$/.test(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' })
    }

    res.end(data)
  })

  server.listen(port, (err) => {
    if (err) {
      return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
  })
}
