import pino from 'pino'

/**
 * Plugin factory
 *
 * @param {string} pkgName - NPM package name
 * @returns {class}
 */
async function factory (pkgName) {
  const me = this

  /**
   * BajoLogger class
   *
   * @class
   */
  class BajoLogger extends this.app.pluginClass.base {
    static alias = 'log'

    constructor () {
      super(pkgName, me.app)
      this.config = {
        log: {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              ignore: '`pid,hostname`'
            }
          }
        }
      }
    }

    init = async () => {
      const { importModule } = this.app.bajo
      const { get, set, forOwn, isEmpty } = this.app.lib._
      const { extractText } = this.app.lib.aneka
      const logLevels = await importModule('bajo:/lib/log-levels.js')
      const { isIgnored } = await importModule('bajo:/class/base/log.js', { asDefaultImport: false })
      const me = this
      const opts = this.getConfig().log ?? {}
      opts.level = this.app.bajo.config.log.level
      if (get(opts, 'transport.target') === 'pino-pretty') {
        set(opts, 'transport.options.translateTime', 'UTC:yyyy-mm-dd\'T\'HH:MM:ss.l\'Z\'')
      }
      this.instance = pino(opts)
      const logger = {
        child: function () {
          const child = Object.create(this)
          child.pino = me.instance.child({})
          return child
        }
      }
      forOwn(logLevels, (v, k) => {
        logger[k] = (...args) => {
          const [data, msg, ...rest] = args
          const params = isEmpty(data) ? [msg, ...rest] : [data, msg, ...rest]
          const { result: ns } = extractText(msg, '[', ']')
          if (!ns) {
            this.instance[k](...params)
            return
          }
          if (!isIgnored.call(me.app[ns], k)) this.instance[k](...params)
        }
      })
      this.logger = logger
      this.log.debug('switchedToLogger%s', 'Pino')
    }

    start = async () => {
    }
  }

  return BajoLogger
}

export default factory
