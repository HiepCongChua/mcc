let app = require('../server');
const Boom = require('@hapi/boom');
let loopbackContext = require('loopback-context');
module.exports = function () {
	return async (req, res, next) => {
		let ctx = loopbackContext.getCurrentContext();
		let token = req.query.access_token
        if (!token) {
			return next(Boom.unauthorized('Missing authorization token'))
		}
		token = token.replace('Bearer ', '')
		const data = app.utils.jwt.verifyToken(token)
		if (!data) {
			return next(Boom.unauthorized('Invalid authorization token or expired'))
		}
		ctx.set('user', {id: data.uuid})
		return next()
	}
}
