import pino from 'pino'

async function factory (pkgName) {
  const me = this

  return class BajoLogger extends this.lib.BajoPlugin {
    constructor () {
      super(pkgName, me.app)
      this.alias = 'log'
      this.config = {
        log: {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              ignore: 'pid,hostname'
            }
          }
        }
      }
    }

    init = async () => {
      const { logLevels } = this.app.bajo
      const { get, set, forOwn, isEmpty } = this.app.bajo.lib._
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
          let [data, msg, ...rest] = args
          msg = me.print.write(msg, ...rest)
          const params = isEmpty(data) ? [msg, ...rest] : [data, msg, ...rest]
          this.instance[k](...params)
        }
      })
      this.logger = logger
      this.log.debug('switchedToLogger%s', 'Pino')
    }

    start = async () => {
    }
  }
}

export default factory
