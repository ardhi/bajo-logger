import pino from 'pino'

async function init () {
  const { logLevels } = this.app.bajo
  const { sprintf } = this.app.bajo.lib
  const { get, set, forOwn, isEmpty, isPlainObject } = this.app.bajo.lib._
  const i18n = this.app.bajoI18N
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
      if (i18n) {
        if (isPlainObject(args[0])) msg = i18n.t(msg, rest[0])
        else msg = i18n.t(msg, { ns: me.name, postProcess: 'sprintf', sprintf: rest })
      } else msg = sprintf(msg, ...rest)
      const params = isEmpty(data) ? [msg, ...rest] : [data, msg, ...rest]
      this.instance[k](...params)
    }
  })
  this.logger = logger
  this.log.debug('switchedToLogger%s', 'Pino')
}

export default init
