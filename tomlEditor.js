const fs = require('fs/promises')
const toml = require('toml');
const json2toml = require('json2toml');

const init = async () => {
  const data = await fs.readFile("./wrangler.toml", 'utf8')
  const name = process.argv[3]
  const parsed = toml.parse(data)
  parsed.name = name
  const changed = json2toml(parsed)
  await fs.writeFile("./wrangler.toml", changed)
}

init()