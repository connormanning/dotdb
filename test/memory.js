import '@babel/polyfill'
import fs from 'fs'
import path from 'path'

import { expect } from 'chai'
import { Memory } from '../src/index'

class Test {
    constructor(name, createInstance) {
        this.name = name
        this.createInstance = createInstance
    }
}

const localFile = path.join(__dirname, 'db.json')

const tests = [
    new Test('memory', () => new Memory()),
    new Test('persistent-memory', () => new Memory(localFile))
]

const clear = async (db) => {
    Object.keys(await db.get()).forEach(async v => { await db.del(v) })
    if (fs.existsSync(localFile)) fs.unlinkSync(localFile)
}

const run = (test) => describe(test.name, () => {
    let db

    beforeEach(async () => {
        db = test.createInstance()
    })

    afterEach(async () => {
        await clear(db)
        expect(await db.get()).to.deep.equal({ })
    })

    it('initialized as an empty object', async () => {
        expect(await db.get()).to.deep.equal({ })
    })

    it('rejects invalid "put" operations', () => {
        expect(() => db.putSync()).to.throw()
        expect(() => db.putSync(42)).to.throw()
        expect(() => db.putSync('a')).to.throw()
        expect(() => db.putSync({ })).to.throw()
        expect(() => db.putSync(null)).to.throw()
        expect(() => db.putSync(undefined)).to.throw()
        expect(() => db.putSync([])).to.throw()
        expect(() => db.putSync(['a'])).to.throw()
    })

    it('synchronously puts/deletes entries', () => {
        db.putSync('a', 'b', 'd')   // Make sure we replace this value properly.
        db.putSync('a', 'b', 'c')

        // Verify output.
        expect(db.getSync('a', 'b', 'c')).to.equal(undefined)
        expect(db.getSync('a', 'b')).to.equal('c')
        expect(db.getSync('a')).to.deep.equal({ b: 'c' })

        // Delete.
        expect(db.delSync('a', 'b')).to.equal(true)
        expect(db.delSync('a', 'b')).to.equal(false)    // Already deleted.

        // Verify empty.
        expect(db.getSync('a', 'b')).to.equal(undefined)
        expect(db.getSync('a')).to.equal(undefined)
    })

    it('handles nested entries', () => {
        db.putSync('a', 'one', 1)
        db.putSync('a', 'two', 2)

        // Verify output.
        expect(db.getSync('a', 'one')).to.equal(1)
        expect(db.getSync('a', 'two')).to.equal(2)
        expect(db.getSync('a')).to.deep.equal({ one: 1, two: 2 })

        // Delete a single entry - one should remain.
        expect(db.delSync('a', 'two')).to.equal(true)
        expect(db.delSync('a', 'two')).to.equal(false)  // Already deleted.

        // Verify that the remaining entry still exists.
        expect(db.getSync('a', 'one')).to.equal(1)
        expect(db.getSync('a')).to.deep.equal({ one: 1 })

        // Delete last entry and verify empty.
        expect(db.delSync('a', 'one')).to.equal(true)
        expect(db.getSync('a', 'one')).to.equal(undefined)
        expect(db.getSync('a')).to.equal(undefined)
    })

    it('handles explicitly inserted empty objects appropriately', () => {
        // We clean up recursively on deleted a key that results in an empty
        // object at a leaf node - however if there is another key containing
        // an empty object (which can only happen if an empty object was
        // explicitly placed as a value), make sure it's not deleted as it's
        // not upstream of the one we're deleting.
        db.putSync('a', 'b', { })
        db.putSync('a', 'c', { })
        db.delSync('a', 'c')
        expect(db.getSync('a', 'b')).to.deep.equal({ })

        expect(db.getSync()).to.deep.equal({ a: { b: { } } })
    })
})

tests.forEach(run)

