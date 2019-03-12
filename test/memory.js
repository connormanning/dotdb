import '@babel/polyfill'
import { expect } from 'chai'
import { Memory } from '../src/index'

describe('memory', () => {
    it('rejects invalid "put" operations', () => {
        const db = new Memory()
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
        const db = new Memory()
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
        const db = new Memory()
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
})

