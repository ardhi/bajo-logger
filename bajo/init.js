import pino from 'pino'

export default async function () {
  const { getConfig, logLevels, getPkg, log } = this.bajo.helper
  const _ = await getPkg('lodash')
  const self = this
  const config = getConfig()
  const opts = getConfig('bajoLogger').log || {}
  opts.level = config.log.level
  if (_.get(opts, 'transport.target') === 'pino-pretty')
    _.set(opts, 'transport.options.translateTime', `UTC:yyyy-mm-dd'T'HH:MM:ss.l'Z'`)
  this.bajoLogger.instance = pino(opts)
  const logger = {
    child: function () {
      const child = Object.create(this)
      child.pino = self.bajoLogger.instance.child({})
      return child
    }
  }
  _.forOwn(logLevels, (v, k) => {
    logger[k] = (data, msg, ...args) => {
      const params = _.isEmpty(data) ? [msg, ...args] : [data, msg, ...args]
      this.bajoLogger.instance[k](...params)
    }
  })
  this.bajoLogger.logger = logger
  log.debug(`Switched to 'Pino' logger`)
}