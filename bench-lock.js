import { readFileSync } from 'node:fs'
import { load, dump } from 'js-yaml'
import { parse, stringify } from 'yaml'
import { join } from 'node:path'

const lockLittle = readFileSync(join('fixtures', 'pnpm-lock.yaml', 'little-pnpm-lock.yaml'), 'utf8')
const lockLarge = readFileSync(join('fixtures', 'pnpm-lock.yaml', 'large-pnpm-lock.yaml'), 'utf8')

console.log('\nLock little:')
console.time('js-yaml read')
load(lockLittle)
console.timeEnd('js-yaml read')

console.time('yaml read')
parse(lockLittle)
console.timeEnd('yaml read')

console.time('js-yaml write')
dump(load(lockLittle))
console.timeEnd('js-yaml write')

console.time('yaml write')
stringify(parse(lockLittle))
console.timeEnd('yaml write')

console.log('\nLock large:')
console.time('js-yaml read')
load(lockLarge)
console.timeEnd('js-yaml read')

console.time('yaml read')
parse(lockLarge)
console.timeEnd('yaml read')

console.time('js-yaml write')
dump(load(lockLarge))
console.timeEnd('js-yaml write')

console.time('yaml write')
stringify(parse(lockLarge))
console.timeEnd('yaml write')
