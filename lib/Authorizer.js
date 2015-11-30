/**
 * Created by mnaughton on 11/30/2015.
 */

var _ = require('underscore');
var modelUtil = require('model-util');

/**Parse constraints used to query permissions.
 @param type A string representing the type to query on, or a hash where the singular key is a type and its value is a model or id for the producer to query on. Pass null for any type.
 @returns {Object} A hash with type and producer specified as needed.*/
function parseType(type){
	var constraints = {};

	if(type){
		if(_.isObject(type)){
			_.each(type, function(producer, type){
				constraints.type = type;
				constraints.producer = modelUtil.idFor(producer);
			});
		} else {
			constraints.type = type;
		}
	}

	return constraints;
}

/**
 * An authorizer base class, which provides a number of `can*` methods for determining whether the current user is allowed to do something.
 * @constructor
 * @param {string|object} type The model type associated with this authorizer instance. This can also be a mapping from model type to model ID.
 * @return {object} An instance of the default authorizer class.
 */
function Authorizer(type){
	this.initialize(type);
}

Authorizer.prototype = {
	/**
	 * Determines whether or not the given request object is authenticated.
	 * @param  {object}  req The request object.
	 * @return {Boolean}     True if the user is authenticated (logged in), otherwise false.
	 */
	isRequestAuthorized: function(req){
		return _.isObject(req.user);
	},

	/**
	 * Initialize this instance.
	 * @param {string | object} type The model type or a mapping from the model type to model ID.
	 */
	initialize: function(type){
		this.setType(type);
	},

	/**
	 * Sets the type associated with this authorizer.
	 * @param {string | object} type The model type or a mapping from the model type to model ID.
	 */
	setType: function(type){
		this.type = type;
		var parsedType = this._parsedType = parseType(type);
		var modelName = parsedType.type;

		if(_.isString(modelName)){
			modelName = modelName.toLowerCase();
		}

		this.modelName = modelName;
	},

	/**
	 * Determines whether the given model can be shown in a list and sends the results to `cb`.
	 *
	 * The default implemenation is equivalent to `canRead(req, model, cb)`.
	 * @param  {object}   req   The request object.
	 * @param  {object}   model The model in question.
	 * @param  {Function} cb    A function which should expect two parameters. The first is an error, if any, and the second is a boolean, true if listing is allowed, otherwise false.
	 */
	canList: function(req, model, cb){
		return this.canRead(req, model, cb);
	},

	/**
	 * Determines whether the given model can be read and sends the results to `cb`.
	 *
	 * The default implemenation is equivalent to `authorizeFor(req, model, 'read', cb)`.
	 * @param  {object}   req   The request object.
	 * @param  {object}   model The model in question.
	 * @param  {Function} cb    A function which should expect two parameters. The first is an error, if any, and the second is a boolean, true if reading is allowed, otherwise false.
	 */
	canRead: function(req, model, cb){
		return this.authorizeFor(req, model, 'read', cb);
	},

	/**
	 * Determines whether the given model can be updated and sends the results to `cb`.
	 *
	 * The default implemenation is equivalent to `authorizeFor(req, model, 'update', cb)`.
	 * @param  {object}   req   The request object.
	 * @param  {object}   model The model in question.
	 * @param  {Function} cb    A function which should expect two parameters. The first is an error, if any, and the second is a boolean, true if updating is allowed, otherwise false.
	 */
	canUpdate: function(req, model, cb){
		return this.authorizeFor(req, model, 'update', cb);
	},

	/**
	 * Determines whether the given model can be deleted and sends the results to `cb`.
	 *
	 * The default implemenation is equivalent to `authorizeFor(req, model, 'delete', cb)`.
	 * @param  {object}   req   The request object.
	 * @param  {object}   model The model in question.
	 * @param  {Function} cb    A function which should expect two parameters. The first is an error, if any, and the second is a boolean, true if deleting is allowed, otherwise false.
	 */
	canDelete: function(req, model, cb){
		return this.authorizeFor(req, model, 'delete', cb);
	},

	/**
	 * Determines whether a model of the current type can be created and sends the results to `cb`.
	 *
	 * The default implemenation is equivalent to `authorizeFor(req, null, 'create', cb)`.
	 * @param  {object}   req   The request object.
	 * @param  {Function} cb    A function which should expect two parameters. The first is an error, if any, and the second is a boolean, true if creating is allowed, otherwise false.
	 */
	canCreate: function(req, cb){
		return this.authorizeFor(req, null, 'create', cb);
	},

	/**
	 * Determines whether the given action can be performed on the given model and sends the results to `cb`.
	 *
	 * The default implementation checks if a user is in the "admin" group. If so, they are authorized for all actions. If not, the `permissionSet` attribute of the current user is queried to determine their authorization result. Anonymous authorization is always declined.
	 * @param  {object}   req    The request object.
	 * @param  {object}   model  The model in question.
	 * @param  {string}   action The action.
	 * @param  {Function} cb     A function which should expect two parameters. The first is an error, if any, and the second is a boolean, true if creating is allowed, otherwise false.
	 * @abstract
	 * @type {Function}
	 */
	authorizeFor: null
};

Authorizer.extend = require('backbone-extend-standalone');

module.exports = Authorizer;