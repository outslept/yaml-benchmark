import { readFileSync } from 'node:fs'
import { load, dump } from 'js-yaml'
import { parse, stringify } from 'yaml'
import { join } from 'node:path'

const modulesLittle = readFileSync(join('fixtures', '.modules.yaml', 'little-modules.yaml'), 'utf8')
const modulesLarge = readFileSync(join('fixtures', '.modules.yaml', 'large-modules.yaml'), 'utf8')

console.log('\nModules little:')
console.time('js-yaml read')
load(modulesLittle)
console.timeEnd('js-yaml read')

console.time('yaml read')
parse(modulesLittle)
console.timeEnd('yaml read')

console.time('js-yaml write')
dump(load(modulesLittle))
console.timeEnd('js-yaml write')

console.time('yaml write')
stringify(parse(modulesLittle))
console.timeEnd('yaml write')

console.log('\nModules large:')
console.time('js-yaml read')
load(modulesLarge)
console.timeEnd('js-yaml read')

console.time('yaml read')
parse(modulesLarge)
console.timeEnd('yaml read')

console.time('js-yaml write')
dump(load(modulesLarge))
console.timeEnd('js-yaml write')

console.time('yaml write')
stringify(parse(modulesLarge))
console.timeEnd('yaml write')
