var Authorizer = require('./Authorizer');
var _ = require('underscore');

module.exports = Authorizer.extend({
	/**
	 * A controller base class, which provides a number of lifecycle callbacks for processing and authorization of models.
	 * @constructor
	 * @param {String|Object} type      The type of the data model with which the inheriting controller is associated.
	 *
	 * If the value is a string, an instance of `DefaultAuthorizer` will be created for authorization of models, and it
	 * will be provided with that type.
	 * If the value is an object, it is assumed that it inherits DefaultAuthorizer.
	 * @param {String} [modelName] The model name. This is a lower-case version of the type. If not provided, it will be generated base on the other input.
	 * @return {Object} An instance of a base controller.
	 */
	constructor: function(type, modelName){
		this.authorizer = this.createAuthorizer(type, modelName);

		if(_.isString(type) || _.size(type) === 1){
			this.initialize(type);
		} else {
			this.initialize(this.authorizer.type);
		}

		var bindArgs = _.functions(this);

		bindArgs.unshift(this);
		_.bindAll.apply(_, bindArgs);
	},

	/**
	 * Creates the Authorizer used by the controller class for filtering out models.
	 * @param type The type of the data model with which the inheriting controller is associated.
	 * @param modelName The model name. This is a lower-case version of the type.
	 * @return An Authorizer instance, or null, to delegate to the controller for authorization.
	 * @type {Function}
	 * @abstract
	 */
	createAuthorizer: null,

	/**
	 * Gets the query configuration for the given scenario ('create', 'find', 'findOne', 'update', 'destroy').
	 * @param {IncomingMessage} req The request object.
	 * @param {String} scenario The scenario.
	 * @return {Object} A hash of query settings.
	 */
	getQueryConfiguration: function(req, scenario){
		return {};
	},

	/**
	 * A callback used to determine whether a given model can be deleted.
	 * @param  {object}   req   The request object.
	 * @param  {object}   model The model in question.
	 * @param  {Function} cb    The completion callback. First argument is an error, if any, and second argument is a boolean; true to allow deletion, otherwise false.
	 */
	canDelete: function(req, model, cb){
		var self = this;

		this.beforeAuthorize(req, function(err){
			if(err){return cb(err);}

			self.authorizer.canDelete(req, model, cb);
		});
	},

	/**
	 * A callback used to determine whether a given model can be shown in a list.
	 * @param  {object}   req   The request object.
	 * @param  {object}   model The model in question.
	 * @param  {Function} cb    The completion callback. First argument is an error, if any, and second argument is a boolean; true to allow listing, otherwise false.
	 */
	canList: function(req, model, cb){
		var self = this;

		this.beforeAuthorize(req, function(err){
			if(err){return cb(err);}

			self.authorizer.canList(req, model, cb);
		});
	},

	/**
	 * A callback used to determine whether an item of the type associated with this controller can be created.
	 * @param  {object}   req   The request object.
	 * @param  {Function} cb    The completion callback. First argument is an error, if any, and second argument is a boolean; true to allow creation, otherwise false.
	 */
	canCreate: function(req, cb){
		var self = this;

		this.beforeAuthorize(req, function(err){
			if(err){return cb(err);}

			self.authorizer.canCreate(req, cb);
		});
	},

	/**
	 * A callback used to determine whether a given model can be modified.
	 * @param  {object}   req   The request object.
	 * @param  {object}   model The model in question.
	 * @param  {Function} cb    The completion callback. First argument is an error, if any, and second argument is a boolean; true to allow modification, otherwise false.
	 */
	canUpdate: function(req, model, cb){
		var self = this;

		this.beforeAuthorize(req, function(err){
			if(err){return cb(err);}

			self.authorizer.canUpdate(req, model, cb);
		});
	},

	/**
	 * A callback used to determine whether a given model can be read.
	 * @param  {object}   req   The request object.
	 * @param  {object}   model The model in question.
	 * @param  {Function} cb    The completion callback. First argument is an error, if any, and second argument is a boolean; true to allow reading, otherwise false.
	 */
	canRead: function(req, model, cb){
		var self = this;

		this.beforeAuthorize(req, function(err){
			if(err){return cb(err);}

			self.authorizer.canRead(req, model, cb);
		});
	},

	/**
	 * Called before authorization for an operation takes place.
	 * @param  {object}   req The request object.
	 * @param  {Function} cb  The completion callback. First argument is an error, if any. No other arguments are supplied.
	 */
	beforeAuthorize: function(req, cb){
		cb();
	},

	/**
	 * Called before an object is deleted.
	 * @param  {object}   req   The request object.
	 * @param  {object}   model The data model to be deleted.
	 * @param  {Function} cb    The completion callback. First argument is an error, if any, and second argument is the model to delete, or null, if prevention of deletion is desired.
	 */
	beforeDelete: function(req, model, cb){
		return cb(null, model);
	},

	/**
	 * Called after an object id deleted.
	 * @param  {object}   req   The request object
	 * @param  {object}   model The data model that was deleted.
	 * @param  {Function} cb    The completion callback. First argument is an error, if any. No other arguments are provided.
	 */
	afterDelete: function(req, model, cb){
		cb();
	},

	/**
	 * Called before an object is read.
	 * @param  {object}   req   The request object.
	 * @param  {object}   model The data model to be read.
	 * @param  {Function} cb    The completion callback. First argument is an error, if any, and second argument is the model to read, or null, if prevention of reading is desired.
	 */
	beforeRead: function(req, model, cb){
		return cb(null, model);
	},

	/**
	 * Called after an object is read.
	 * @param  {object}   req   The request object.
	 * @param  {object}   model The data model that was read.
	 * @param  {Function} cb    The completion callback. First argument is an error, if any. No other arguments are provided.
	 */
	afterRead: function(req, model, cb){
		cb();
	},

	/**
	 * Called before an object is created.
	 * @param  {object}   req         The request object.
	 * @param  {object}   modelParams A hash of attributes which will be saved to the model.
	 * @param  {Function} cb          The completion callback. First argument is an error, if any. Second argument is the hash of attributes, or null, if the save is to be cancelled.
	 */
	beforeCreate: function(req, modelParams, cb){
		return cb(null, modelParams);
	},

	/**
	 * Called after an object is created.
	 * @param  {object}   req   The request object.
	 * @param  {object}   model The data model that was created.
	 * @param  {Function} cb    The completion callback. First argument is an error, if any. No other arguments are provided.
	 */
	afterCreate: function(req, model, cb){
		cb();
	},

	/**
	 * Called before an object is updated.
	 * @param  {object}   req         The request object.
	 * @param  {object}   modelParams The hash of attributes to be set on the object.
	 * @param  {object}   model       The current data model.
	 * @param  {Function} cb          The completion callback. First argument is an error, if any. Second argument is the hash of attributes (`modelParams`), or null, if the update is to be cancelled.
	 */
	beforeUpdate: function(req, modelParams, model, cb){
		return cb(null, modelParams);
	},

	/**
	 * Called after an object is updated.
	 * @param  {object}   req   The request objet.
	 * @param  {object}   model The data model that was updated.
	 * @param  {Function} cb    The completion callback. First argument is an error, if any. No other arguments are specified.
	 */
	afterUpdate: function(req, model, cb){
		cb();
	},

	/**
	 * Called when exporting a data model to JSON. Override this function to add or remove properties as needed.
	 * @param  {object}   req   The request object.
	 * @param  {object}   model The data model to be exported.
	 * @param  {Function} cb    The completion callback. First argument is an error, if any. Second argument is a JSON version of the given model.
	 */
	export: function(req, model, cb){
		return cb(null, model.toJSON());
	},

	create: require('./controller/create'),
	destroy: require('./controller/destroy'),
	find: require('./controller/find'),
	findOne: require('./controller/findOne'),
	findone: require('./controller/findone'), //for some reason, it's not camel-cased in the default blueprints, so aliasing here to ensure we catch everything.
	update: require('./controller/update')
});