/**
   * Module dependencies
   */
var util = require('util'),
actionUtil = require('./helpers/actionUtil');
 
/**
   * Find One Record
   *
   * get /:modelIdentity/:id
   *
   * An API call to find and return a single model instance from the data adapter
   * using the specified id.
   *
   * Required:
   * @param {Integer|String} id  - the unique id of the particular instance you'd like to look up *
   *
   * Optional:
   * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
   */

module.exports = function findOneRecord(req, res){

	var Model = actionUtil.parseModel(req, this.modelName);
	var pk = actionUtil.requirePk(req);
	var self = this;

	var query = Model.findOne(pk);

	var opts = _.defaults({}, this.getQueryConfiguration(req, 'findOne'), {
		populate: true
	});

	if(opts.populate){
		if(_.isArray(opts.populate)){
			_.each(opts.populate, function(populate){
				query = query.populate(populate);
			});
		} else {
			query = actionUtil.populateEach(query, req);
		}
	}
   
	query.exec(function found(err, model){
		if(err) {return res.serverError(err);}

		if(!model) {return res.notFound('No record found with the specified `id`.');}

		self.canRead(req, model, function(err, value){
			if(err){return res.serverError(err);}

			if(!self.authorizer.isRequestAuthorized(req)){return res.notFound('No record found with the specified `id`.');}

			if(!value){return res.forbidden({
				error: 'You are not authorized to view this ' + Model.globalId
			});}

			self.beforeRead(req, model, function(err, model){
				if(err){return res.serverError(err);}

				if(!model){
					return res.ok(null);
				}

				if(sails.hooks.pubsub && req.isSocket) {
					Model.subscribe(req, model);
					actionUtil.subscribeDeep(req, model);
				}

				self.export(req, model, function(err, modelJSON){
					if(err){return res.serverError(err);}
					self.afterRead(req, model, function(err){
						if(err){return res.serverError(err);}

						res.ok(modelJSON);
					});
				});                           
			});
		});
	});

};