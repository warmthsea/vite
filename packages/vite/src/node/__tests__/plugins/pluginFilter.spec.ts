import util from 'node:util'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import {
  FALLBACK_FALSE,
  FALLBACK_TRUE,
  createCodeFilter,
  createFilterForTransform,
  createIdFilter,
} from '../../plugins/pluginFilter'

describe('createIdFilter', () => {
  const filters = [
    { inputFilter: undefined, cases: undefined },
    {
      inputFilter: 'foo.js',
      cases: [
        { id: 'foo.js', expected: true },
        { id: 'foo.ts', expected: FALLBACK_FALSE },
        { id: '\0foo.js', expected: FALLBACK_FALSE },
        { id: '\0' + path.resolve('foo.js'), expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: ['foo.js'],
      cases: [
        { id: 'foo.js', expected: true },
        { id: 'foo.ts', expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: { include: 'foo.js' },
      cases: [
        { id: 'foo.js', expected: true },
        { id: 'foo.ts', expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: { include: '*.js' },
      cases: [
        { id: 'foo.js', expected: true },
        { id: 'foo.ts', expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: { include: /\.js$/ },
      cases: [
        { id: 'foo.js', expected: true },
        { id: 'foo.ts', expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: { include: /\/foo\.js$/ },
      cases: [
        { id: 'a/foo.js', expected: true },
        ...(process.platform === 'win32'
          ? [{ id: 'a\\foo.js', expected: true }]
          : []),
        { id: 'a_foo.js', expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: { include: [/\.js$/] },
      cases: [
        { id: 'foo.js', expected: true },
        { id: 'foo.ts', expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: { exclude: 'foo.js' },
      cases: [
        { id: 'foo.js', expected: false },
        { id: 'foo.ts', expected: FALLBACK_TRUE },
      ],
    },
    {
      inputFilter: { exclude: '*.js' },
      cases: [
        { id: 'foo.js', expected: false },
        { id: 'foo.ts', expected: FALLBACK_TRUE },
      ],
    },
    {
      inputFilter: { exclude: /\.js$/ },
      cases: [
        { id: 'foo.js', expected: false },
        { id: 'foo.ts', expected: FALLBACK_TRUE },
      ],
    },
    {
      inputFilter: { exclude: [/\.js$/] },
      cases: [
        { id: 'foo.js', expected: false },
        { id: 'foo.ts', expected: FALLBACK_TRUE },
      ],
    },
    {
      inputFilter: { include: 'foo.js', exclude: 'bar.js' },
      cases: [
        { id: 'foo.js', expected: true },
        { id: 'bar.js', expected: false },
        { id: 'baz.js', expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: { include: '*.js', exclude: 'foo.*' },
      cases: [
        { id: 'foo.js', expected: false }, // exclude has higher priority
        { id: 'bar.js', expected: true },
        { id: 'foo.ts', expected: false },
      ],
    },
    {
      inputFilter: '/virtual/foo',
      cases: [{ id: '/virtual/foo', expected: true }],
    },
  ]

  for (const filter of filters) {
    test(`${util.inspect(filter.inputFilter)}`, () => {
      const idFilter = createIdFilter(filter.inputFilter, '')
      if (!filter.cases) {
        expect(idFilter).toBeUndefined()
        return
      }
      expect(idFilter).not.toBeUndefined()

      for (const testCase of filter.cases) {
        const { id, expected } = testCase
        expect(idFilter!(id), id).toBe(expected)
      }
    })
  }
})

describe('createCodeFilter', () => {
  const filters = [
    { inputFilter: undefined, cases: undefined },
    {
      inputFilter: 'import.meta',
      cases: [
        { code: 'import.meta', expected: true },
        { code: 'import_meta', expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: ['import.meta'],
      cases: [
        { code: 'import.meta', expected: true },
        { code: 'import_meta', expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: { include: 'import.meta' },
      cases: [
        { code: 'import.meta', expected: true },
        { code: 'import_meta', expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: { include: /import\.\w+/ },
      cases: [
        { code: 'import.meta', expected: true },
        { code: 'import_meta', expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: { include: [/import\.\w+/] },
      cases: [
        { code: 'import.meta', expected: true },
        { code: 'import_meta', expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: { exclude: 'import.meta' },
      cases: [
        { code: 'import.meta', expected: false },
        { code: 'import_meta', expected: FALLBACK_TRUE },
      ],
    },
    {
      inputFilter: { exclude: /import\.\w+/ },
      cases: [
        { code: 'import.meta', expected: false },
        { code: 'import_meta', expected: FALLBACK_TRUE },
      ],
    },
    {
      inputFilter: { exclude: [/import\.\w+/] },
      cases: [
        { code: 'import.meta', expected: false },
        { code: 'import_meta', expected: FALLBACK_TRUE },
      ],
    },
    {
      inputFilter: { include: 'import.meta', exclude: 'import_meta' },
      cases: [
        { code: 'import.meta', expected: true },
        { code: 'import_meta', expected: false },
        { code: 'importmeta', expected: FALLBACK_FALSE },
      ],
    },
    {
      inputFilter: { include: /import\.\w+/, exclude: /\w+\.meta/ },
      cases: [
        { code: 'import.meta', expected: false }, // exclude has higher priority
        { code: 'import.foo', expected: true },
        { code: 'foo.meta', expected: false },
      ],
    },
  ]

  for (const filter of filters) {
    test(`${util.inspect(filter.inputFilter)}`, () => {
      const codeFilter = createCodeFilter(filter.inputFilter)
      if (!filter.cases) {
        expect(codeFilter).toBeUndefined()
        return
      }
      expect(codeFilter).not.toBeUndefined()

      for (const testCase of filter.cases) {
        const { code, expected } = testCase
        expect(codeFilter!(code), code).toBe(expected)
      }
    })
  }
})

describe('createFilterForTransform', () => {
  const filters = [
    { inputFilter: [undefined, undefined], cases: undefined },
    {
      inputFilter: ['*.js', undefined],
      cases: [
        { id: 'foo.js', code: 'foo', expected: true },
        { id: 'foo.ts', code: 'foo', expected: false },
      ],
    },
    {
      inputFilter: [undefined, 'import.meta'],
      cases: [
        { id: 'foo.js', code: 'import.meta', expected: true },
        { id: 'foo.js', code: 'import_meta', expected: false },
      ],
    },
    {
      inputFilter: [{ exclude: '*.js' }, 'import.meta'],
      cases: [
        { id: 'foo.js', code: 'import.meta', expected: false },
        { id: 'foo.js', code: 'import_meta', expected: false },
        { id: 'foo.ts', code: 'import.meta', expected: true },
        { id: 'foo.ts', code: 'import_meta', expected: false },
      ],
    },
    {
      inputFilter: [{ include: 'foo.ts', exclude: '*.js' }, 'import.meta'],
      cases: [
        { id: 'foo.js', code: 'import.meta', expected: false },
        { id: 'foo.js', code: 'import_meta', expected: false },
        { id: 'foo.ts', code: 'import.meta', expected: true },
        { id: 'foo.ts', code: 'import_meta', expected: true },
      ],
    },
  ]

  for (const filter of filters) {
    test(`${util.inspect(filter.inputFilter)}`, () => {
      const [idFilter, codeFilter] = filter.inputFilter
      const filterForTransform = createFilterForTransform(
        idFilter,
        codeFilter,
        '',
      )
      if (!filter.cases) {
        expect(filterForTransform).toBeUndefined()
        return
      }
      expect(filterForTransform).not.toBeUndefined()

      for (const testCase of filter.cases) {
        const { id, code, expected } = testCase
        expect(filterForTransform!(id, code), util.inspect({ id, code })).toBe(
          expected,
        )
      }
    })
  }
})
