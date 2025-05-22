import { readFileSync } from 'node:fs'
import { load, dump } from 'js-yaml'
import { parse, stringify } from 'yaml'
import { join } from 'node:path'

const workspaceLittle = readFileSync(join('fixtures', 'pnpm-workspace.yaml', 'little-pnpm-workspace.yaml'), 'utf8')

console.log('\nWorkspace little:')
console.time('js-yaml read')
load(workspaceLittle)
console.timeEnd('js-yaml read')

console.time('yaml read')
parse(workspaceLittle)
console.timeEnd('yaml read')

console.time('js-yaml write')
dump(load(workspaceLittle))
console.timeEnd('js-yaml write')

console.time('yaml write')
stringify(parse(workspaceLittle))
console.timeEnd('yaml write')
