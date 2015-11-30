/**
 * Created by mnaughton on 11/30/2015.
 */

var CoreAuthorizer = null;
var Controller = require('./lib/Controller');
var Authorizer = require('./lib/Authorizer');
var _ = require('underscore');

Controller = Controller.extend({
	createAuthorizer: function(type, modelName){
		var authorizer = type;

		if(_.isString(type) || _.size(type) === 1){
			authorizer = new DefaultAuthorizer(type);
		}

		return authorizer;
	}
});

var DefaultAuthorizer = Authorizer.extend({
	getCoreAuthorizer: function(){
		if(!this._authorizer && CoreAuthorizer){
			this._authorizer = new CoreAuthorizer(this.type);
		}

		return this._authorizer;
	},

	authorizeFor: function(req, model, action, cb){
		return this.getCoreAuthorizer().authorizeFor(req, model, action, cb);
	}
});

module.exports = function(sails){
	function extendBlueprints(cb){
		sails.modules.loadBlueprints(function(err, modules){
			if(err){return cb(err);}

			_.extend(Controller.prototype, modules); //allow clients to override our defaults
			cb();
		});
	}

	return {
		defaults: {
			__configKey__: {
				DefaultAuthorizer: null
			}
		},

		configure: function(){
			CoreAuthorizer = sails.config[this.configKey].DefaultAuthorizer;
		},

		initialize: function(cb){
			if(sails.hooks.blueprints && sails.hooks.blueprints.middleware){
				_.defaults(Controller.prototype, sails.hooks.blueprints.middleware); //but don't just revert to the blueprint defaults
			} else {
				sails.after('hook:blueprints:loaded', function(){
					_.defaults(Controller.prototype, sails.hooks.blueprints.middleware);
				});
			}

			extendBlueprints(cb);
		},

		Authorizer: Authorizer,

		Controller: Controller
	};
};

module.exports.Authorizer = Authorizer;
module.exports.Controller = Controller;