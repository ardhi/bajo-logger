import pino from 'pino'

export default async function () {
  const { getPluginName, getConfig, logLevels, importPkg, log } = this.bajo.helper
  const _ = await importPkg('lodash::bajo')
  const self = this
  const i18n = _.get(this, 'bajoI18N.instance')
  const config = getConfig()
  const opts = getConfig('bajoLogger').log || {}
  opts.level = config.log.level
  if (_.get(opts, 'transport.target') === 'pino-pretty')
    _.set(opts, 'transport.options.translateTime', `UTC:yyyy-mm-dd'T'HH:MM:ss.l'Z'`)
  this.bajoLogger.instance = pino(opts)
  const ns = getPluginName(3)
  const logger = {
    child: function () {
      const child = Object.create(this)
      child.pino = self.bajoLogger.instance.child({})
      return child
    }
  }
  _.forOwn(logLevels, (v, k) => {
    logger[k] = (data, msg, ...args) => {
      if (i18n) {
        let ns = args[0]
        if (ns === 'bajo') ns = 'bajoI18N'
        if (_.isPlainObject(args[1])) msg = i18n.t(msg, _.merge({ ns }, args[1]))
        else msg = i18n.t(msg, { ns, postProcess: 'sprintf', sprintf: null })
      }
      const params = _.isEmpty(data) ? [msg, ...args] : [data, msg, ...args]
      this.bajoLogger.instance[k](...params)
    }
  })
  this.bajoLogger.logger = logger
  log.debug(`Switched to 'Pino' logger`)
}