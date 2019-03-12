import _ from 'lodash'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import util from 'util'

const mkdirpAsync = util.promisify(mkdirp)
const readFileAsync = util.promisify(fs.readFile)
const writeFileAsync = util.promisify(fs.writeFile)

export default class Memory {
    constructor(path) {
        this.path = path
        this.data = { }
    }

    async init() {
        if (!this.path) return

        await mkdirpAsync(fs.dirname(this.path))

        try {
            this.data = JSON.parse(await readFileAsync(this.path))
            console.log('Initialized memory DB from', this.path)
        }
        catch (err) {
            console.log('Starting memory DB from scratch')
        }
    }

    async put(...args) { return this.putSync(...args) }
    async get(...args) { return this.getSync(...args) }
    async del(...args) { return this.delSync(...args) }

    putSync(...args) {
        if (!_.isArray(args)) {
            throw new Error('Invalid put: must be array')
        }
        if (args.length < 2) {
            throw new Error('Invalid put: must have at least 2 arguments')
        }

        const path = args.slice(0, -1)
        const item = args[args.length - 1]
        const result = _.setWith(this.data, path, item, Object)
        this._save()
        return result
    }

    getSync(...path) {
        return _.get(this.data, path)
    }

    delSync(...path) {
        const result = this._delWithin(...path)
        if (result) this._save()
        return result
    }

    _delWithin(...path) {
        if (!_.has(this.data, path)) return false

        _.unset(this.data, path)

        const next = path.slice(0, -1)

        // If we've emptied the object at this path, clean up parents.
        if (next.length && _.isEmpty(_.get(this.data, next))) {
            this._delWithin(...next)
        }
        return true
    }

    _save() {
        if (!this.path) return
        return fs.writeFile(this.path, JSON.stringify(this.data))
    }
}

