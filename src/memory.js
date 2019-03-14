import _ from 'lodash'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import util from 'util'

const mkdirpAsync = util.promisify(mkdirp)
const readFileAsync = util.promisify(fs.readFile)
const writeFileAsync = util.promisify(fs.writeFile)

export default class Memory {
    constructor(file) {
        this._file = file
        this._data = { }
    }

    async init() {
        if (!this._file) return this

        await mkdirpAsync(path.dirname(this._file))
        if (fs.existsSync(this._file)) {
            this._data = JSON.parse(await readFileAsync(this._file)) || { }
        }

        return this
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
        const result = _.setWith(this._data, path, item, Object)
        this._save()
        return result
    }

    getSync(...path) {
        if (!path.length) return this._data
        return _.get(this._data, path)
    }

    delSync(...path) {
        const result = this._delWithin(...path)
        if (result) this._save()
        return result
    }

    _delWithin(...path) {
        if (!_.has(this._data, path)) return false

        _.unset(this._data, path)

        const next = path.slice(0, -1)

        // If we've emptied the object at this path, clean up parents.
        if (next.length && _.isEmpty(_.get(this._data, next))) {
            this._delWithin(...next)
        }
        return true
    }

    _save() {
        if (!this._file) return
        return fs.writeFileSync(this._file, JSON.stringify(this._data))
    }
}

