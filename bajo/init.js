import pino from 'pino'

async function init () {
  const { getConfig, logLevels, importPkg, log } = this.bajo.helper
  const { get, set, forOwn, isEmpty } = await importPkg('lodash-es')
  const self = this
  const config = getConfig()
  const opts = getConfig('bajoLogger').log ?? {}
  opts.level = config.log.level
  if (get(opts, 'transport.target') === 'pino-pretty') {
    set(opts, 'transport.options.translateTime', 'UTC:yyyy-mm-dd\'T\'HH:MM:ss.l\'Z\'')
  }
  this.bajoLogger.instance = pino(opts)
  const logger = {
    child: function () {
      const child = Object.create(this)
      child.pino = self.bajoLogger.instance.child({})
      return child
    }
  }
  forOwn(logLevels, (v, k) => {
    logger[k] = (...args) => {
      const [data, msg, ...rest] = args
      /*
      if (i18n) {
        let ns = rest[0]
        if (ns === 'bajo') ns = 'bajoI18N'
        if (isPlainObject(rest[1])) msg = i18n.t(msg, merge({ ns }, rest[1]))
        else msg = i18n.t(msg, { ns, postProcess: 'sprintf', sprintf: null })
      }
      */
      const params = isEmpty(data) ? [msg, ...rest] : [data, msg, ...rest]
      this.bajoLogger.instance[k](...params)
    }
  })
  this.bajoLogger.logger = logger
  log.debug('Switched to \'Pino\' logger')
}

export default init
